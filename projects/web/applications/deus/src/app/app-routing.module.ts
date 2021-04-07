import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthAPI } from 'common/api/auth-api';
import { AnyUserGuard } from 'common/api/guards/any-user.guard';
import { PageNotFound } from './page-not-found/page-not-found';


const routes: Routes = [
  { path: '', canActivate: [ AuthAPI ], children: [

    { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
    {
      path: '',
      loadChildren: () => import('./main/main.module').then(m => m.MainModule),
      canLoad: [ AnyUserGuard ],
      data: { fallback: '/auth/sign-in' }
    }

  ] },

  { path: '**', component: PageNotFound }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      initialNavigation: 'enabledBlocking'
    })
  ],
  exports: [ RouterModule ],
  providers: [
    AnyUserGuard
  ]
})
export class AppRoutingModule { }
