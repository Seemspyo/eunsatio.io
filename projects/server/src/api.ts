import 'reflect-metadata';
import '../polyfills/node-fetch-http2-header';

import Koa from 'koa';
import Router from '@koa/router';
import compose from 'koa-compose';
import compress from 'koa-compress';
import { createSecureServer } from 'http2';
import { constants as zlibConstants } from 'zlib';

import { config } from './config/api';
import { createStaticSecureContext } from '../lib/tls';
import { prepareToDie } from '../lib/util/prepare-to-die';
import { LocalLogger } from '../lib/logger';
import { SocialAuthRouter } from './routers/social-auth.router';
import { AuthHelper } from '../lib/auth';
import { createTransport } from 'nodemailer';
import { Brackets, createConnection, getRepository } from 'typeorm';

import {
  entities,
  User,
  userProviders
} from './models';
import { userRoles } from './roles/common';
import { GQLServer } from './graphql/server';


process.title = config.name;

const api = new Koa();
const systemLog = new LocalLogger('api', config.systemLogPath);

const
auth = new AuthHelper(config.apiSecret),
mail = config.mail && createTransport({
  host: config.host,
  secure: true,
  auth: {
    user: config.mail.username,
    pass: config.mail.password
  }
});

api
.use(
  compress({

    threshold: '2kb',
    gzip: {
      flush: zlibConstants.Z_SYNC_FLUSH
    },
    br: {
      params: {
        [ zlibConstants.BROTLI_PARAM_MODE ]: zlibConstants.BROTLI_MODE_TEXT,
        [ zlibConstants.BROTLI_PARAM_QUALITY ]: 4
      }
    },
    deflate: false

  })
)
.use(
  compose(new GQLServer(auth, mail, systemLog).middleware)
);

{
  const router = new Router();

  // integrate routers
  router.use(
    new SocialAuthRouter(auth, mail, systemLog, { prefix: '/auth/social' }).routes()
  );

  api
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

  if (!config.db) {

    throw new Error('database configuration required.');
  }

  {
    const { host, port, username, password, database } = config.db;

    await createConnection({
      type: 'mysql',
      host,
      port,
      username,
      password,
      database,
      entities,
      synchronize: true,
      charset: 'utf8mb4_unicode_ci'
    });
  }

  if (config.masterAccount) {

    const { email, username, password } = config.masterAccount;

    const repo = getRepository(User);

    let user = await repo.createQueryBuilder('user')
                         .select('user.id')
                         .setParameters({ email, username, provider: userProviders.email })
                         .where('user.provider = provider')
                         .andWhere(new Brackets(subQuery => {

                          subQuery
                          .where('user.email = :email')
                          .orWhere('user.username = :username');

                         }))
                         .getOne();
    
    if (user) {

      const dupMessage = user.email === email ? `email: ${ email }` : `username ${ username }`;

      console.warn(`deus account with ${ dupMessage } already exists`);

    } else {

      user = Object.assign(new User(), {
        email,
        username,
        password: auth.SHAEncrypt(password),
        provider: userProviders.email,
        roles: [ userRoles.deus ]
      });

      await repo.save(user);

    }
  }

  if (!config.ssl) {

    throw new Error('ssl configuration required.');
  }

  const { key, cert, ca } = config.ssl;

  const service = createSecureServer({
    allowHTTP1: true,
    SNICallback(_, next) {

      return next(null, createStaticSecureContext(key, cert, ca));
    }
  }, api.callback())
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
