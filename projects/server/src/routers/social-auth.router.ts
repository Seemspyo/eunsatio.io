import Router from '@koa/router';
import Mail from 'nodemailer/lib/mailer';
import { resolve } from 'path';
import { AuthHelper } from '../../lib/auth';
import {
  SocialAPIClient,
  SocialProvider,
  GithubAPIClient,
  GoogleAPIClient,
  FacebookAPIClient,
  socialProviders
} from '../../lib/social';
import { parseJSONSafe } from '@eunsatio.io/util/dist/json';
import { setAuthCookie } from '../../lib/auth/cookie-auth';
import { Logger } from '../../lib/logger';
import { config } from '../config/api';
import { getRepository } from 'typeorm';
import { User, userRoles } from '../models/user.model';
import { readFile } from 'fs/promises';
import { render } from 'mustache';


interface SocialRouteState {

  client: SocialAPIClient;
  code?: string;
  provider?: SocialProvider;
  dest?: string;

}

export class SocialAuthRouter extends Router<SocialRouteState> {

  constructor(
    private auth: AuthHelper,
    private mail?: Mail | null,
    private logger?: Logger | null,
    options?: Router.RouterOptions
  ) {
    super(options);

    const { github, google, facebook } = config.social;

    const activeProviders: SocialProvider[] = []

    if (github) {

      this.enableGithubRouter(github);
      activeProviders.push('github');

    }

    if (google) {

      this.enableGoogleRouter(google);
      activeProviders.push('google');

    }

    if (facebook) {

      this.enableFacebookRouter(facebook);
      activeProviders.push('facebook');

    }

    if (activeProviders.length) {

      this.enableAuthRouter(activeProviders);

    }
  }

  private enableGithubRouter(githubConfig: NonNullable<typeof config['social']['github']>) {
    this
    .use('/github', async (ctx, next) => {
      const { clientId, clientSecret } = githubConfig;

      ctx.state.client = new GithubAPIClient({
        clientId,
        clientSecret,
        redirectURI: `https://${ config.host }/auth/social/github/next`
      });

      return next();
    })
    .get('/github/next', async (ctx, next) => {
      const { code, state } = ctx.query;

      Object.assign(ctx.state, {
        code,
        provider: socialProviders.github,
        dest: parseJSONSafe(state as string)?.dest
      });

      return next();
    });
  }

  private enableGoogleRouter(googleConfig: NonNullable<typeof config['social']['google']>) {
    this
    .use('/google', async (ctx, next) => {
      const { clientId, clientSecret } = googleConfig;

      ctx.state.client = new GoogleAPIClient({
        clientId,
        clientSecret,
        redirectURI: `https://${ config.host }/auth/social/google/next`
      });

      return next();
    })
    .get('/google/next', async (ctx, next) => {
      const { code, state } = ctx.query;

      Object.assign(ctx.state, {
        code,
        provider: socialProviders.google,
        dest: parseJSONSafe(state as string)?.dest
      });

      return next();
    });
  }

  private enableFacebookRouter(facebookConfig: NonNullable<typeof config['social']['facebook']>) {
    this
    .use('/facebook', async (ctx, next) => {
      const { clientId, clientSecret } = facebookConfig;

      ctx.state.client = new FacebookAPIClient({
        clientId,
        clientSecret,
        redirectURI: `https://${ config.host }/auth/social/facebook/next`
      });

      return next();
    })
    .get('/facebook/next', async (ctx, next) => {
      const { error, code, state } = ctx.query;

      if (error) {

        ctx.throw(500, error);
      }

      Object.assign(ctx.state, {
        code,
        provider: socialProviders.facebook,
        dest: parseJSONSafe(state as string)?.dest
      });

      return next();
    });
  }

  private enableAuthRouter(providers: SocialProvider[]) {
    this
    .get(`/(${ providers.join('|') })`, async ctx => {
      const { dest } = ctx.query;

      const uri = ctx.state.client.buildAuthURI(Array.isArray(dest) ? dest[0] : dest);

      ctx.redirect(uri.toString());
    })
    .get(`/(${ providers.join('|') })/next`, async ctx => {
      const { client, code, provider, dest = '/' } = ctx.state;

      if (!code) {

        ctx.throw(400, 'naughty request');
      }

      const accessToken = await client.getAccessToken(code);

      if (!accessToken) {

        ctx.throw(500, 'Failed to retrieve access token');
      }

      // create or update profile of existing user
      const profile = await client.getProfile(accessToken);

      if (!profile) {

        ctx.throw(500, 'Failed to access profile data');
      }

      const repo = getRepository(User);
      const { uid, email, username, profileImageUrl } = profile!;

      let
      user = await repo.findOne({ uid, provider, deleted: false }),
      created = false;

      if (user) {

        if (user.blocked) {

          ctx.throw(403, 'this account has been blocked');
        }

      } else { // create user

        user = Object.assign(new User(), {
          uid,
          provider,
          roles: [ userRoles.common ]
        });

        created = true;

      }

      Object.assign(user, { email, username, profileImageUrl }); // assign profile

      await repo.save(user);

      if (created) { // send welcome mail asyncronously

        this.sendWelcomeMail(user);

      }

      const token = this.auth.signToken({ id: user.id });

      setAuthCookie(ctx.cookies, 'Bearer', token, { domain: `.${ config.domain }` });

      ctx.redirect(dest);
    });
  }

  private async sendWelcomeMail(user: User) {
    if (!(this.mail instanceof Mail && config.mail)) return;

    const
    providerName = user.provider.charAt(0).toUpperCase() + user.provider.slice(1),
    { botName: from, socialWelcomeSubject: subject } = config.mail;

    try {

      const buffer = await readFile(resolve(__dirname, 'assets/templates/social-welcome.template.html'));

      const html = render(buffer.toString('utf-8'), { user, providerName });

      await this.mail.sendMail({
        from,
        to: user.email,
        subject,
        html
      });

    } catch (error) {

      this.logger?.log(error);

    }
  }

}
