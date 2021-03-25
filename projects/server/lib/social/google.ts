import { google, Auth } from 'googleapis';
import { SocialAPIClient, SocialProfile } from './@social';


export interface GoogleOAuth2Config {

  clientId: string;
  clientSecret: string;
  redirectURI: string;

}

export class GoogleAPIClient implements SocialAPIClient {

  private oAuth2Client!: Auth.OAuth2Client;

  constructor(
    config: GoogleOAuth2Config
  ) {
    this.oAuth2Client = new google.auth.OAuth2(config);
  }

  buildAuthURI(dest = '/') {

    return new URL(this.oAuth2Client.generateAuthUrl({
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      state: JSON.stringify({ dest: encodeURI(dest) })
    }));
  }

  /**
   * 
   * @param { string } code Access code
   */
  async getAccessToken(code: string) {
    const res = await this.oAuth2Client.getToken(code);

    if (res.tokens.access_token) {

      return res.tokens.access_token;
    }

    throw new Error('Failed to get access token');
  }

  async getProfile(accessToken: string) {
    const { data } = await google.people('v1').people.get({
      access_token: accessToken,
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos'
    });

    return {
      uid: data.resourceName?.replace('people/', ''),
      email: data.emailAddresses?.[0].value,
      username: data.names?.[0].displayName || 'Anonymous',
      profileImageUrl: data.photos?.[0].url
    } as SocialProfile;
  }

}
