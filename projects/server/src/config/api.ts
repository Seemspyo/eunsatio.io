import { resolve } from 'path';
import { config as applyConfig } from 'dotenv';
import { ifAllExists } from '@eunsatio.io/util/dist/if-all-exists';


applyConfig({ path: resolve(__dirname, 'common.env') });
applyConfig({ path: resolve(__dirname, 'api.env') });

const {

  APP_SECRET = 'eunsatio.io',
  WHITE_LIST = '*',
  DOMAIN = 'eunsatio.io',

  NAME = 'eunsatio-api',
  HOST = 'localhost',
  PORT = '2800',
  SYSTEM_LOG = 'log/api.log',
  API_SECRET = 'dev',
  GRAPHQL_PATH = '/graphql',

  TLS_PRIVATE_KEY,
  TLS_CERT,
  TLS_CHAIN,

  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_NAME,

  DEV_MODE = 'true',

  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,

  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,

  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,

  DEUS_EMAIL,
  DEUS_USERNAME,
  DEUS_PASSWORD,

  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_REGION = 'ap-northeast-2',
  AWS_BUCKET,
  AWS_ORIGIN_ALT,

  EMAIL_HOST,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  EMAIL_BOT_ACCOUNT = 'no-reply',
  SOCIAL_WELCOME_SUBJECT = 'Welcome!'

} = process.env;

export const config = {

  appSecret: APP_SECRET,
  whiteList: WHITE_LIST === '*' ? WHITE_LIST : WHITE_LIST.split(','),
  domain: DOMAIN,

  name: NAME,
  host: HOST,
  port: Number.parseInt(PORT),
  systemLogPath: SYSTEM_LOG,
  apiSecret: API_SECRET,
  gqlPath: GRAPHQL_PATH,

  ssl: ifAllExists([ TLS_PRIVATE_KEY, TLS_CERT ], {
    key: TLS_PRIVATE_KEY!,
    cert: TLS_CERT!,
    ca: TLS_CHAIN
  }),

  db: ifAllExists([ DB_USERNAME, DB_PASSWORD, DB_NAME ], {
    username: DB_USERNAME!,
    password: DB_PASSWORD!,
    host: DB_HOST,
    port: Number.parseInt(DB_PORT),
    database: DB_NAME!
  }),

  devMode: DEV_MODE === 'true',

  social: {
    github: ifAllExists([ GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET ], {
      clientId: GITHUB_CLIENT_ID!,
      clientSecret: GITHUB_CLIENT_SECRET!
    }),
    google: ifAllExists([ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ], {
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!
    }),
    facebook:  ifAllExists([ FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET ], {
      clientId: FACEBOOK_CLIENT_ID!,
      clientSecret: FACEBOOK_CLIENT_SECRET!
    })
  },

  masterAccount: ifAllExists([ DEUS_EMAIL, DEUS_USERNAME, DEUS_PASSWORD ], {
    email: DEUS_EMAIL!,
    username: DEUS_USERNAME!,
    password: DEUS_PASSWORD!
  }),

  s3: ifAllExists([ AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET], {
    accessKey: AWS_ACCESS_KEY!,
    secretKey: AWS_SECRET_KEY!,
    region: AWS_REGION,
    bucket: AWS_BUCKET!,
    originAlt: AWS_ORIGIN_ALT
  }),

  mail: ifAllExists([ EMAIL_HOST, EMAIL_USERNAME, EMAIL_PASSWORD ], {
    host: EMAIL_HOST!,
    username: EMAIL_USERNAME!,
    password: EMAIL_PASSWORD!,
    botName: EMAIL_BOT_ACCOUNT,
    socialWelcomeSubject: SOCIAL_WELCOME_SUBJECT
  })

}
