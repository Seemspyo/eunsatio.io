import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Route,
  Router
} from '@angular/router';
import { AuthAPI } from '../auth-api';


@Injectable()
export class VisitorOnlyGuard implements CanActivate {

  constructor(
    private auth: AuthAPI,
    private router: Router
  ) { }

  canLoad(route: Route) {
    if (this.auth.authorized) {

      return this.router.parseUrl(route.data?.fallback ?? '/');
    }

    return true;
  }

  canActivate(route: ActivatedRouteSnapshot) {
    if (this.auth.authorized) {

      return this.router.parseUrl(route.data.fallback ?? '/');
    }

    return true;
  }

}
