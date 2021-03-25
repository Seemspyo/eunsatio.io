import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { GQLClient } from 'common/graphql-client';
import { SignInInput, User } from '@eunsatio.io/server';
import gql from 'graphql-tag';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HTTP_STATE_EXPLICIT } from 'common/http-transfer';
import { USER_FIELDS } from './user-api';


/**
 * currerntly `initialNavigation: 'enabled'`, which required for angular universal,
 * invokes Router Guards before `APP_INITIALIZER` running.
 * for now, use `CanActivate` on root router instead.
 */
@Injectable()
export class AuthAPI implements CanActivate {

  private user: User|null = null;
  private _initialized = false;

  public get initialized() {

    return this._initialized;
  }

  public get me() {

    return this.user;
  }

  public get authorized() {

    return Boolean(this.user);
  }

  public authState!: BehaviorSubject<boolean>;

  private queries = {

    signIn: gql`
      mutation SignIn($input: SignInInput!) {
        token: signIn(input: $input)
      }
    `,

    signOut: gql`
      mutation {
        result: signOut
      }
    `,

    me: gql`
      query {
        me {
          ${ USER_FIELDS.join('\n') }
        }
      }
    `

  }

  constructor(
    private graphql: GQLClient
  ) { }

  async canActivate() {
    if (!this.initialized) {

      await this.init();

    }

    return true;
  }

  public async init() {
    if (this.initialized) return;

    const user = await this.catchUser().toPromise();
    
    this._initialized = true;
    this.authState = new BehaviorSubject<boolean>(Boolean(user));
  }

  public signIn(input: SignInInput) {
    const { signIn }  = this.queries;

    return this.graphql.query<{ token: string; }>(signIn, { input }).pipe(
      switchMap(res => {

        return this.catchUser().pipe(
          map(user => {
            this.authState.next(Boolean(user));

            return res.token;
          })
        );
      })
    );
  }

  public signOut() {
    const { signOut } = this.queries;

    return this.graphql.query<{ result: boolean; }>(signOut).pipe(
      map(res => {
        this.user = null;
        this.authState.next(false);

        return res.result;
      })
    );
  }

  private catchUser() {
    const
    { me } = this.queries,
    params = { [ HTTP_STATE_EXPLICIT ]: 'me' }

    return this.graphql.query<{ me: User|null; }>(me, undefined, { params }).pipe(
      map(res => {

        return this.user = res.me;
      })
    );
  }

}
