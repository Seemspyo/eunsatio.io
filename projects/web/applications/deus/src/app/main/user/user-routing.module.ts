import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { UserComponent } from './user.component';


const routes: Routes = [

  { path: '', component: UserComponent, data: { tree: 'users' }, children: [

    { path: '', component: UserListComponent, data: { tree: '' } }

  ] }

]

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ]
})
export class UserRoutingModule { }
