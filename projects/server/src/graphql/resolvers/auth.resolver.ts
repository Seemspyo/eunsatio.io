import { setAuthCookie } from '../../../lib/auth/cookie-auth';
import { UserInputError } from 'apollo-server-errors';
import { config } from '../../config/api';
import {
  GQLForbiddenError,
  GQLInvalidError,
  GQLPasswordInvalidError
} from '../../errors';
import { User, userProviders } from '../../models';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver
} from 'type-graphql';
import { Brackets, getRepository } from 'typeorm';
import { GQLContext } from '../../graphql/@graphql';
import { allUsers } from './@resolver';


@InputType()
export class BasicAuthInput {

  @Field({ description: 'supports `aes-256-cbc` encryption. if encrpyted, `key` field must provided.' })
  secret!: string;

  @Field({ nullable: true, description: 'AES key with public key encryption.' })
  key?: string;

}

@InputType()
export class SignInInput {

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  username?: string;

  @Field()
  password!: string;

}

@Resolver()
export class AuthResolver {

  private userRepo = getRepository(User);

  @Query(returns => Boolean, { description: 'use this query to check token expiration.' })
  checkAuth(
    @Ctx() { authType }: GQLContext
  ) {

    return Boolean(authType);
  }

  @Query(returns => String)
  getPublicKey(
    @Ctx() { auth }: GQLContext
  ) {

    return auth.publicKey;
  }

  @Mutation(returns => String)
  basicAuth(
    @Ctx() { auth, koaContext: { cookies } }: GQLContext,
    @Arg('input') { secret, key }: BasicAuthInput
  ) {
    if (key) {

      try {

        key = auth.RSADecrypt(key);

      } catch {

        throw new UserInputError('fail to decode `key`', { target: 'input.key', value: key });
      }

      try {

        secret = auth.AESDecrypt(key, secret);

      } catch {

        throw new UserInputError('fail to decode `secret`', { input: 'input.secret', value: secret });
      }

    }

    if (secret !== config.appSecret) {

      throw new GQLInvalidError();
    }

    const token = auth.signToken({}); // what can possibly goes in the payload?

    setAuthCookie(cookies, 'Basic', token, { domain: `.${ config.domain }` });

    return token;
  }

  @Authorized('*')
  @Mutation(returns => String)
  async signIn(
    @Ctx() { auth, koaContext: { cookies } }: GQLContext,
    @Arg('input') { email, username, password }: SignInInput
  ) {
    if (!(email || username) || !password) {

      throw new GQLInvalidError('either email or username must provided');
    }

    const user = await this.userRepo
                            .createQueryBuilder('user')
                            .addSelect('user.password')
                            .setParameters({ email, username, false: 0, provider: userProviders.email })
                            .where('user.deleted = :false')
                            .andWhere('user.provider = :provider')
                            .andWhere(new Brackets(subQuery => {

                              subQuery
                              .where('user.email = :email')
                              .orWhere('user.username = :username');

                            }))
                            .getOneOrFail();

    if (user.blocked) {

      throw new GQLForbiddenError('account has been blocked.');
    }

    if (user.password !== auth.SHAEncrypt(password)) {

      throw new GQLPasswordInvalidError();
    }

    const token = auth.signToken({ id: user.id });

    setAuthCookie(cookies, 'Bearer', token, { domain: `.${ config.domain }` });

    return token;
  }

  @Authorized(allUsers)
  @Mutation(returns => Boolean, { description: 'use this query for cookie-based(credential) login.' })
  signOut(
    @Ctx() { auth, koaContext: { cookies } }: GQLContext
  ) {
    const token = auth.signToken({});

    setAuthCookie(cookies, 'Basic', token, { domain: `.${ config.domain }` });

    return true;
  }

}
