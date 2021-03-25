import { resolve } from 'path';
import Router from '@koa/router';
import { serveStatic } from '../../lib/static';
import { existsSync, readFileSync } from 'fs';
import { renderModule } from '@angular/platform-server';
import { InjectionToken } from '@angular/core';
import { ParameterizedContext } from 'koa';
import { config } from '../config/ng';


export interface AngularServerRouterConfing {

  root: string;
  index: string;
  serverBundle: string;
  serverModule: string;
  staticExtensions: string[];
  subdomains: string[] | null;

}

interface AngularIvyServerModule {

  renderModule: typeof renderModule;
  KOA_CONTEXT?: InjectionToken<ParameterizedContext>;
  [ key: string ]: any;

}

declare const __non_webpack_require__: NodeRequire;

function importOnce(path: string) {
  const module = __non_webpack_require__(path);

  delete __non_webpack_require__.cache[__non_webpack_require__.resolve(path)];

  return module;
}

export class AngularIvyServer extends Router {

  constructor(
    private config: AngularServerRouterConfing,
    options?: Router.RouterOptions
  ) {
    super(options);

    this.enableNgServerRouter();
  }

  private enableNgServerRouter() {
    const {
      root,
      index,
      serverBundle,
      serverModule,
      staticExtensions,
      subdomains
    } = this.config;

    const withSubdomain = Boolean(subdomains?.length);

    /**
     * root needs to be aliased with subdomain enabled because they should acts like a virtual hosts.
     */
    let rootAlias = '';

    if (withSubdomain) {

      rootAlias = 'root';

      const serverMap = new Map(subdomains!.map(sub => {

        return [ sub, serveStatic(resolve(root, sub), staticExtensions) ];
      }));

      this.use(async (ctx, next) => {
        const serve = serverMap.get(ctx.subdomains.join('.'));

        if (serve) {

          return serve(ctx, next);
        }

        return next();
      });

    }

    this
    .use(serveStatic(resolve(root, rootAlias), staticExtensions))
    .get(/.*/, async (ctx, next) => {
      const
      dir = ctx.subdomains.join('.') || rootAlias,
      path = ctx.path.startsWith('/') ? ctx.path.replace('/', '') : ctx.path;

      // first, find index file from subdirectory
      const indexPath = resolve(root, dir, path, index);

      let
      indexHTML: string|null = null,
      serverBundlePath: string|null = null;

      if (existsSync(indexPath)) {

        indexHTML = readFileSync(indexPath).toString('utf8');
        serverBundlePath = resolve(root, dir, path, serverBundle);

      } else { // try fallback to root

        const rootIndexPath = resolve(root, dir, index);

        if (existsSync(rootIndexPath)) {

          indexHTML = readFileSync(rootIndexPath).toString('utf8');
          serverBundlePath = resolve(root, dir, serverBundle);

        }

      }

      if (indexHTML) {

        // render Ivy module
        if (serverBundlePath && existsSync(serverBundlePath)) {

          ctx.state.appSecret = config.appSecret;

          const bundle: AngularIvyServerModule = importOnce(serverBundlePath);

          indexHTML = await bundle.renderModule(bundle[serverModule], {
            document: indexHTML,
            url: ctx.url,
            extraProviders: bundle.KOA_CONTEXT && [
              {
                provide: bundle.KOA_CONTEXT,
                useValue: ctx
              }
            ]
          });

        }

        ctx.body = indexHTML;

        return;
      }

      return next();
    });
  }

}
