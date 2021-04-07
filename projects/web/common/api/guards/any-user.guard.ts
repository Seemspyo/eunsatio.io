import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanLoad,
  Data,
  Route,
  Router
} from '@angular/router';
import { AuthAPI } from '../auth-api';


@Injectable()
export class AnyUserGuard implements CanActivate, CanLoad {

  constructor(
    private auth: AuthAPI,
    private router: Router
  ) { }

  canLoad(route: Route) {
    
    return this.canPass(route.data);
  }

  canActivate(snapshot: ActivatedRouteSnapshot) {
    
    return this.canPass(snapshot.data);
  }

  private async canPass(data?: Data) {
    await this.auth.init(); // workaround for https://github.com/angular/universal/issues/1623

    if (!this.auth.authorized) {

      return this.router.parseUrl(data?.fallback ?? '/');
    }

    return true;
  }
  
}
