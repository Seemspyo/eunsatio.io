import { ExtendableContext } from 'koa';
import Cookies from 'cookies';


const AUTH_KEY = 'Authorization';

export function setAuthCookie(cookies: Cookies, type: string, credential: string, options?: Cookies.SetOption) {
  const authorization = `${ type } ${ credential }`;

  cookies.set(AUTH_KEY, `${ type } ${ credential }`, options);

  return authorization;
}

/**
 * 
 * NOTE: `type` is always lowercased
 */
export function getAuth(ctx: ExtendableContext) {
  const authorization = ctx.cookies.get(AUTH_KEY) || ctx.get(AUTH_KEY);

  if (!authorization) {

    return null;
  }

  const [ type, credential ] = authorization.split(' ');

  return { type: type.toLowerCase(), credential }
}
