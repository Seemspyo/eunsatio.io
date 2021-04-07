import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { CommonPage } from './pages/common';
import { DashboardComponent } from './common/dashboard/dashboard.component';


/**
 * Define router `tree` id to data
 * ex) data: { tree: 'exampleId' }
 * 
 * and use it on each page
 * ex) layoutStore.setDrawer([
      {
        type: 'routerLink',
        label: 'Example', // name of label
        tree: [ '', 'exampleId' ], // tree ids, specifying child tree is not necessary.
        link: '/example',
        children: // currently not supported.
      }
 * ])
 *
 * NOTE: current max tree level is 2
 */
const routes: Routes = [
  { path: '', component: MainComponent, children: [

    { path: '', component: CommonPage, data: { tree: '' }, children: [

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, data: { tree: 'dashboard' } }

    ] },

    { path: 'users', loadChildren: () => import('./user/user.module').then(m => m.UserModule) },

    { path: 'blog', data: { tree: 'blog' } }

  ] }
]

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ]
})
export class MainRoutingModule { }
