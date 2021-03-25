import { AuthHelper } from '../../lib/auth';
import { Logger } from '../../lib/logger';
import { ParameterizedContext } from 'koa';
import Mail from 'nodemailer/lib/mailer';
import { User } from '../models';


export interface GQLContext {

  auth: AuthHelper;
  mail?: Mail | null;
  logger?: Logger | null;
  authType: string | null;
  user?: User | null;
  koaContext: ParameterizedContext;

}
