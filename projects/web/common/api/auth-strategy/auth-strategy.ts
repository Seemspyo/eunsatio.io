import { isPlatformServer } from '@angular/common';
import {
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {
  Inject,
  Injectable,
  Optional,
  PLATFORM_ID,
  SkipSelf
} from '@angular/core';
import { GQLClient } from 'common/graphql-client';
import { HTTP_STATE_IGNORE } from 'common/http-transfer';
import { GraphQLError } from 'graphql';
import gql from 'graphql-tag';
import { ParameterizedContext } from 'koa';
import { map, switchMap } from 'rxjs/operators';
import { KOA_CONTEXT } from './@auth-strategy';


export const
AUTH_KEY = 'Authorization',
AUTH_IGNORE_KEY = 'Θauth-ignore';

export class AuthStrategyConfig {

  origin: string = '';
  path: string = '/graphql';
  domain?: string;

}

export interface BasicAuthResponse {

  data: { token: string; } | null;
  errors?: GraphQLError[];

}

/**
 * This Auth strategy relies on Server-side rendering with Angular Universal & Cookies.
 */
@Injectable()
export class AuthStrategy implements HttpInterceptor {

  private isServer!: boolean;
  private gql!: GQLClient;
  private config!: AuthStrategyConfig;

  private authorization?: string;
  private authChecked = false;

  constructor(
    @Inject(PLATFORM_ID) platformID: Object,
    gql: GQLClient,
    @Optional() @SkipSelf() parentGQL?: GQLClient,
    @Optional() config?: AuthStrategyConfig,
    @Optional() @Inject(KOA_CONTEXT) private ctx?: ParameterizedContext
  ) {
    this.isServer = isPlatformServer(platformID);
    this.gql = parentGQL || gql;
    this.config = { ...new AuthStrategyConfig(), ...config }
    this.authorization = ctx?.cookies.get(AUTH_KEY);
  }

  intercept(req: HttpRequest<any>, handler: HttpHandler) {
    if (req.params.has(AUTH_IGNORE_KEY)) {

      return handler.handle(req.clone({ params: req.params.delete(AUTH_IGNORE_KEY) }));
    }

    if (this.isServer) {

      const
      url = new URL(req.url),
      { origin, path } = this.config;

      if ((origin ? origin.match(url.origin) : true) && path === url.pathname) {

        const handleRequest = () => {
          req = req.clone({
            headers: req.headers.append(AUTH_KEY, this.authorization!)
          });

          return handler.handle(req);
        }

        // if has authorization cookie
        if (this.authorization) {

          if (this.authChecked) {

            return handleRequest();
          } else { // validate token

            return this.checkAuth().pipe(
              switchMap(valid => {
                this.authChecked = true;

                if (valid) {

                  return handleRequest();
                } else {

                  return this.basicAuth().pipe(
                    switchMap(() => handleRequest())
                  );
                }
              })
            );
          }

        } else {

          return this.basicAuth().pipe(
            switchMap(() => handleRequest())
          );
        }

      }

    } else {

      req = req.clone({ withCredentials: true });

    }

    return handler.handle(req);
  }

  private basicAuth() {
    const
    query = gql`
      mutation BasicAuth($input: BasicAuthInput!) {

        token: basicAuth(input: $input)

      }
    `,
    variables = {
      input: {
        secret: this.ctx!.state.appSecret
      }
    },
    params = {
      [ AUTH_IGNORE_KEY ]: 'true',
      [ HTTP_STATE_IGNORE ]: 'true'
    }

    return this.gql.query<{ token: string; }>(query, variables, { params }).pipe(
      map(res => {

        this.authorization = `Basic ${ res.token }`;
        this.ctx!.cookies.set(AUTH_KEY, this.authorization, this.config.domain ? { domain: `.${ this.config.domain }` } : undefined);

        return res.token;
      })
    );
  }

  private checkAuth() {
    const query = gql`
      query {
        valid: checkAuth
      }
    `,
    headers = this.authorization ? { [ AUTH_KEY ]: this.authorization } : undefined,
    params = {
      [ AUTH_IGNORE_KEY ]: 'true',
      [ HTTP_STATE_IGNORE ]: 'true'
    }

    return this.gql.query<{ valid: boolean; }>(query, undefined, { params, headers }).pipe(
      map(res => res.valid)
    );
  }

}
