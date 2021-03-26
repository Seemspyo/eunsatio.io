import { Injectable } from '@angular/core';
import { User } from '@eunsatio.io/server';
import { environment } from 'applications/deus/src/environments/env';
import { GQLClient } from 'common/graphql-client';
import { PATTERNS_EMAIL } from 'common/patterns/email';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { GQLFragment, toFragment } from './selection';


export const USER_FIELDS = [
  'id',
  'uid',
  'email',
  'username',
  'joinedAt',
  'roles',
  'provider',
  'profileImageUrl',
  'blocked'
] as const;

@Injectable()
export class UserAPI {

  constructor(
    private graphql: GQLClient
  ) { }

  public getUserPublic(emailOrName: string, select: GQLFragment<User> = USER_FIELDS) {
    const
    query = gql`
      query GetUserPublic($email: String, $username: String) {

        user: getUserPublic(email: $email, username: $username) {
          ...UserFields
        }

      }
      ${ toFragment('UserFields', 'User', select) }
    `,
    variables: Record<string, string> = {}

    variables[ PATTERNS_EMAIL.test(emailOrName) ? 'email' : 'username' ] = emailOrName;

    return this.graphql.query<{ user: User; }>(query, variables).pipe(
      map(res => res.user)
    );
  }

  public getProfileImagePlaceholder() {

    return `${ environment.cdnOrigin }/images/profile-0${ Math.ceil(Math.random() * 4) }.jpg`;
  }

}
