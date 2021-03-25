import { resolve } from 'path';
import { config as applyConfig } from 'dotenv';
import { ifAllExists } from '@eunsatio.io/util/dist/if-all-exists';


applyConfig({ path: resolve(__dirname, 'common.env') });
applyConfig({ path: resolve(__dirname, 'ng.env') });

const {

  APP_SECRET = 'eunsatio.io',
  DOMAIN = 'eunsatio.io',

  NAME = 'eunsatio-ng',
  PORT = '2400',
  SYSTEM_LOG = 'log/api.log',

  TLS_PRIVATE_KEY,
  TLS_CERT,
  TLS_CHAIN,

  DEV_MODE = 'true',

  NG_ROOT = '',
  NG_INDEX = 'index.html',
  NG_SERVER_BUNDLE = 'main.js',
  NG_SERVER_MODULE = 'AppServerModule',
  NG_STATIC_EXTENSIONS = 'js,css,txt,json,ico,png,jpg,jpeg,gif,webp',

  NG_SUBDOMAINS = null

} = process.env;

if (DEV_MODE === 'true') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

export const config = {

  appSecret: APP_SECRET,
  domain: DOMAIN,

  name: NAME,
  port: Number.parseInt(PORT),
  systemLogPath: SYSTEM_LOG,

  ssl: ifAllExists([ TLS_PRIVATE_KEY, TLS_CERT ], {
    key: TLS_PRIVATE_KEY!,
    cert: TLS_CERT!,
    ca: TLS_CHAIN
  }),

  devMode: DEV_MODE === 'true',

  ng: {
    root: NG_ROOT,
    index: NG_INDEX,
    serverBundle: NG_SERVER_BUNDLE,
    serverModule: NG_SERVER_MODULE,
    staticExtensions: NG_STATIC_EXTENSIONS.toLowerCase().split(','),
    subdomains: typeof NG_SUBDOMAINS === 'string' ? NG_SUBDOMAINS.split(',') : null
  }

}
