import fetch from 'node-fetch';
import { URLWithSearchParams } from '@eunsatio.io/util/dist/url';
import { SocialAPIClient, SocialProfile } from './@social';


export interface FacebookOAuth2Config {

  clientId: string;
  clientSecret: string;
  redirectURI: string;

}

interface FacebookAccessTokenResponse {

  access_token: string;
  token_type: string;
  expires_in: number;

}

const
FACEBOOK_ORIGIN = 'https://www.facebook.com',
FACEBOOK_API_ORIGIN = 'https://graph.facebook.com',
FACEBOOK_AUTH_PATH = '/v8.0/dialog/oauth',
FACEBOOK_TOKEN_PATH = '/v8.0/oauth/access_token',
FACEBOOK_PROFILE_PATH = '/v8.0/me';

export class FacebookAPIClient implements SocialAPIClient {

  constructor(
    private config: FacebookOAuth2Config
  ) { }

  buildAuthURI(dest = '/') {
    const { clientId: client_id, redirectURI: redirect_uri } = this.config;

    return new URLWithSearchParams(FACEBOOK_AUTH_PATH, {
      scope: 'email,public_profile',
      client_id,
      redirect_uri,
      state: JSON.stringify({ dest: encodeURI(dest) })
    }, FACEBOOK_ORIGIN);
  }

  async getAccessToken(code: string) {
    const { clientId: client_id, clientSecret: client_secret, redirectURI: redirect_uri } = this.config;

    const url = new URLWithSearchParams(FACEBOOK_TOKEN_PATH, {
      code,
      client_id,
      client_secret,
      redirect_uri
    }, FACEBOOK_API_ORIGIN);

    const res = await fetch(url)
                      .then(res => res.json() as Promise<FacebookAccessTokenResponse>);

    return res.access_token;
  }

  async getProfile(accessToken: string) {
    const url = new URLWithSearchParams(FACEBOOK_PROFILE_PATH, {
      fields: 'id,email,name,picture'
    }, FACEBOOK_API_ORIGIN);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${ accessToken }` } })
                      .then(res => res.json());

    return {
      uid: res.id,
      email: res.email,
      username: res.name,
      profileImageUrl: res.picture?.data?.url
    } as SocialProfile;
  }

}
