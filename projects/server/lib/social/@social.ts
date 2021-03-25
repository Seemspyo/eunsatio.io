import { ValueOf } from '@eunsatio.io/util/dist/type-def';


export const socialProviders = {

  github: 'github',
  google: 'google',
  facebook: 'facebook'

} as const;

export type SocialProvider = ValueOf<typeof socialProviders>;

export interface SocialProfile {

  uid: string;
  email: string;
  username: string;
  profileImageUrl?: string;

}

export interface SocialAPIClient {

  buildAuthURI(...args: any): URL;

  getAccessToken(...args: any): Promise<string | null> | string | null;

  getProfile(...args: any): Promise<SocialProfile | null> | SocialProfile | null;

}
