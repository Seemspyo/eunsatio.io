import fetch from 'node-fetch';
import { URLWithSearchParams } from '@eunsatio.io/util/dist/url';
import { SocialAPIClient, SocialProfile } from './@social';


export interface GithubOAuth2Config {

  clientId: string;
  clientSecret: string;
  redirectURI: string;

}

interface GithubAccessTokenResponse {

  access_token: string;
  token_type: string;
  scope?: string;

}

const
GITHUB_ORIGIN = 'https://github.com',
GITHUB_AUTH_PATH = '/login/oauth/authorize',
GITHUB_TOKEN_PATH = '/login/oauth/access_token',
GITHUB_GRAPHQL_URI = 'https://api.github.com/graphql';

export class GithubAPIClient implements SocialAPIClient {

  constructor(
    private config: GithubOAuth2Config
  ) { }

  buildAuthURI(dest = '/') {
    const { clientId: client_id, redirectURI: redirect_uri } = this.config;

    return new URLWithSearchParams(GITHUB_AUTH_PATH, {
      scope: 'user:email',
      client_id,
      redirect_uri,
      state: JSON.stringify({ dest: encodeURI(dest) })
    }, GITHUB_ORIGIN);
  }

  /**
   * 
   * @param { string } code Access code
   */
  async getAccessToken(code: string) {
    const { clientId: client_id, clientSecret: client_secret } = this.config;

    const res = await fetch(new URL(GITHUB_TOKEN_PATH, GITHUB_ORIGIN), {
      method: 'POST',
      body: JSON.stringify({ code, client_id, client_secret }),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    }).then(res => res.json() as Promise<GithubAccessTokenResponse>);

    return res.access_token;
  }

  async getProfile(accessToken: string) {
    const query = `query {

      viewer {
        databaseId
        email
        name
        avatarUrl
        login
      }

    }`;

    const res = await fetch(GITHUB_GRAPHQL_URI, {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: { Authorization: `Bearer ${ accessToken }`, Accept: 'application/json' }
    }).then(res => res.json());

    const data = res?.data?.viewer;

    if (!data) {
      
      return null;
    }

    return {
      uid: data.databaseId,
      email: data.email,
      username: data.name || data.login,
      profileImageUrl: data.avatarUrl
    } as SocialProfile;
  }

}
