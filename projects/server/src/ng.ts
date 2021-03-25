import Koa from 'koa';
import Router from '@koa/router';
import { createSecureServer } from 'http2';

import { config } from './config/ng';
import { createStaticSecureContext } from '../lib/tls';
import { prepareToDie } from '../lib/util/prepare-to-die';
import { LocalLogger } from '../lib/logger';

import { AngularIvyServer } from './routers/ng-server.router';


process.title = config.name;

const ng = new Koa();
const systemLog = new LocalLogger('ng', config.systemLogPath);

{
  const router = new Router();

  // integrate routers
  router.use(
    new AngularIvyServer(config.ng).routes()
  );

  ng
  .use(router.routes())
  .use(router.allowedMethods());
}

process.addListener('unhandledRejection', (reason, promise) => {

  const message = `${ config.name } slipped at ${ promise }\n${ reason }`;

  console.error(message);
  systemLog.log(message);

});

// init service
{
  if (!config.ssl) {

    throw new Error('ssl configuration required.');
  }

  const { key, cert, ca } = config.ssl;

  const service = createSecureServer({
    allowHTTP1: true,
    SNICallback(_, next) {

      return next(null, createStaticSecureContext(key, cert, ca));
    }
  }, ng.callback())
  .listen(config.port, () => {

    const message = `${ config.name } service running at :${ config.port }`;

    console.log(message);
    systemLog.log(message);

  });

  // prepare for termination
  prepareToDie(code => {

    const message = `${ config.name } has removed from :${ config.port } (exit code: ${ code })`;

    console.log(message);
    systemLog.log(message);
    service.close();

  });
}
