import Koa from 'koa';
import { AuthHelper } from '../../lib/auth';
import { Logger } from '../../lib/logger';
import { getAuth, setAuthCookie } from '../../lib/auth/cookie-auth';
import {
  ApolloServer,
  AuthenticationError
} from 'apollo-server-koa';
import {
  GQLInternalError,
  GQLNotFoundError,
  GQLPermissionError,
  isQueryError
} from '../errors';
import { GraphQLSchema } from 'graphql';
import { Middleware } from 'koa';
import Mail from 'nodemailer/lib/mailer';
import { config } from '../config/api';
import { User } from '../models';
import {
  AuthChecker,
  BuildSchemaOptions,
  buildSchemaSync,
  ForbiddenError
} from 'type-graphql';
import { EntityNotFoundError, getRepository } from 'typeorm';
import { GQLContext } from './@graphql';

import { BaseResolver } from './resolvers/base.resolver';
import { AuthResolver } from './resolvers/auth.resolver';
import { UserResolver } from './resolvers/user.resolver';
import { BlogArticleResolver } from './resolvers/blog-article.resolver';
import { BlogSeriesResolver } from './resolvers/blog-series.resolver';
import { BlogCommentResolver } from './resolvers/blog-comment.resolver';
import { BlogBookmarkResolver } from './resolvers/blog-bookmark.resolver';
import { UploadResolver } from './resolvers/upload.resolver';
import { graphqlUploadKoa } from 'graphql-upload';


export class GQLServer extends Koa {

  constructor(
    private auth: AuthHelper,
    private mail?: Mail | null,
    private logger?: Logger
  ) {
    super();

    const schema = this.createSchemaSync([
      BaseResolver,
      AuthResolver,
      UserResolver,
      BlogArticleResolver,
      BlogSeriesResolver,
      BlogCommentResolver,
      BlogBookmarkResolver,
      UploadResolver
    ]);

    const graphql = this.createGQLServer(schema)
                        .getMiddleware({
                          path: config.gqlPath,
                          cors: {
                            origin: Array.isArray(config.whiteList) ? ctx => {
                              const origin = ctx.request.get('origin');

                              if (!config.whiteList.includes(origin)) {

                                ctx.throw(401, 'NOT_ALLOWED');
                              }

                              return origin
                            } : ctx => ctx.request.get('origin'),
                            allowMethods: 'GET,HEAD,OPTIONS,POST',
                            allowHeaders: [ 'Authorization', 'Content-Type' ],
                            credentials: true
                          }
                        });

    this
    .use( this.consumeAuth() )
    .use( graphqlUploadKoa({ maxFileSize: 1e8, maxFiles: 12 }) ) // apollo-server-koa uses lower version of `fs-capacitor`
    .use( graphql );
  }

  private createSchemaSync(resolvers: BuildSchemaOptions['resolvers']) {

    const authChecker: AuthChecker<GQLContext> = ({ context: ctx }, canPass) => {
      const { authType, user } = ctx;

      switch (authType) {

        case 'basic':

          return canPass.includes('*');

        case 'bearer':

          return canPass.includes('*') || user!.roles.some(role => canPass.includes(role));

        default:

          return false;

      }
    }

    return buildSchemaSync({
      resolvers,
      authChecker
    });
  }

  private createGQLServer(schema: GraphQLSchema) {

    return new ApolloServer({
      schema,
      context: ({ ctx }: { ctx: GQLContext['koaContext'] }): GQLContext => {
        const
        { auth, mail, logger } = this,
        { type, data } = ctx.state;

        return {
          auth,
          mail,
          logger,
          authType: type,
          user: data,
          koaContext: ctx
        }
      },
      debug: config.devMode,
      uploads: false,
      formatError: error => {
        const { originalError } = error;

        if (isQueryError(originalError)) {
          const { message, code } = originalError;

          this.logger?.log(`${ code }: ${ message }`);

          return new GQLInternalError(message);
        }

        if (originalError instanceof AuthenticationError) {

          return new GQLPermissionError();
        }

        if (originalError instanceof ForbiddenError) {

          return new GQLPermissionError();
        }

        if (originalError instanceof EntityNotFoundError) {

          return new GQLNotFoundError();
        }

        return error;
      }
    });
  }

  private consumeAuth(): Middleware {

    return async (ctx, next) => {
      const authorization = getAuth(ctx);

      if (authorization) {

        let payload: User | null = null;

        try {

          payload = this.auth.verifyToken(authorization.credential);

        } catch (error) {

          setAuthCookie(ctx.cookies, 'Expired', '', { domain: `.${ config.domain }` });

          return next();
        }

        if (authorization.type === 'bearer') {

          const user = await getRepository(User)
                            .createQueryBuilder('user')
                            .where('user.deleted = :deleted', { deleted: 0 })
                            .andWhere('user.id = :id', { id: payload!.id })
                            .getOne();

          if (!user) {

            ctx.throw(401, 'invalid authorization token');
          }

          if (user!.blocked) {

            ctx.throw(403, 'forbidden');
          }

          payload = user!;

        }

        ctx.state.type = authorization.type;
        ctx.state.data = payload;

      }

      return next();
    }
  }

}
