import { Injectable } from '@angular/core';
import type {
  User,
  ListInput,
  PagingInput,
  UserCreateInput,
  UserUpdateInput
} from '@eunsatio.io/server';
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

  public getUserPublic(emailOrName: string, select?: GQLFragment<User>) {
    const
    query = gql`
      query GetUserPublic($email: String, $username: String) {

        user: getUserPublic(email: $email, username: $username) {
          ...UserFields
        }

      }
      ${ this.toUserFragment(select) }
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

  public getUserList(sort: ListInput, paging: PagingInput, select?: GQLFragment<User>) {
    const query = gql`
      query GetUserList($sort: ListInput, $paging: PagingInput) {

        users: getUserList(sort: $sort, pagination: $paging) {
          ...UserFields
        }

      }
      ${ this.toUserFragment(select) }
    `;

    return this.graphql.query<{ users: User[]; }>(query, { sort, paging }).pipe(
      map(res => res.users)
    );
  }

  public getUserById(id: string, select?: GQLFragment<User>) {
    const query = gql`
      query GetUserById($id: String!) {

        user: getUserById(id: $id) {
          ...UserFields
        }

      }
      ${ this.toUserFragment(select) }
    `;

    return this.graphql.query<{ user: User; }>(query, { id }).pipe(
      map(res => res.user)
    );
  }

  public createUser(input: UserCreateInput, select?: GQLFragment<User>) {
    const query = gql`
      mutation CreateUser($input: UserCreateInput!) {

        user: createUser(input: $input) {
          ...UserFields
        }

      }
      ${ this.toUserFragment(select) }
    `;

    return this.graphql.query<{ user: User; }>(query, { input }).pipe(
      map(res => res.user)
    );
  }

  public updateUser(id: string, input: UserUpdateInput, select?: GQLFragment<User>) {
    const query = gql`
      mutation CreateUser($id: String!, $input: UserUpdateInput!) {

        user: updateUser(id: $id, input: $input) {
          ...UserFields
        }

      }
      ${ this.toUserFragment(select) }
    `;

    return this.graphql.query<{ user: User; }>(query, { id, input }).pipe(
      map(res => res.user)
    );
  }

  public blockUser(id: string) {
    const query = gql`
      mutation BlockUser($id: String!) {

        blocked: blockUser(id: $id)

      }
    `;

    return this.graphql.query<{ blocked: boolean; }>(query, { id }).pipe(
      map(res => res.blocked)
    );
  }

  public unblockUser(id: string) {
    const query = gql`
      mutation UnblockUser($id: String!) {

        unblocked: unblockUser(id: $id)

      }
    `;

    return this.graphql.query<{ unblocked: boolean; }>(query, { id }).pipe(
      map(res => res.unblocked)
    );
  }

  public deleteUser(id: string) {
    const query = gql`
      mutation DeleteUser($id: String!) {

        deleted: deleteUser(id: $id)

      }
    `;

    return this.graphql.query<{ deleted: boolean; }>(query, { id }).pipe(
      map(res => res.deleted)
    );
  }

  private toUserFragment(select: GQLFragment<User> = USER_FIELDS) {

    return toFragment('UserFields', 'User', select);
  }

}
