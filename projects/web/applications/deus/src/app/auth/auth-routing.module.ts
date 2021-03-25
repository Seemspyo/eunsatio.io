import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VisitorOnlyGuard } from 'common/api/guards/visitor-only.guard';
import { SignComponent } from './sign/sign.component';


const routes: Routes = [
  { path: 'sign-in', component: SignComponent, canActivate: [ VisitorOnlyGuard ] }
]

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [ RouterModule ],
  providers: [
    VisitorOnlyGuard
  ]
})
export class AuthRoutingModule { }
