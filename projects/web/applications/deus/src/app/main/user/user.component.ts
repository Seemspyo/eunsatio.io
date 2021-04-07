import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { faUserNinja } from '@fortawesome/free-solid-svg-icons';
import { LayoutStore } from '../layout/layout.store';


@Component({
  selector: 'deus-user',
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [`
    .user {
      display: block;
      width: 100%;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'user'
  }
})
export class UserComponent implements OnInit {

  constructor(
    private layout: LayoutStore
  ) { }

  ngOnInit() {
    this.layout.setDrawer([
      {
        type: 'routerLink',
        icon: faUserNinja,
        label: 'Users',
        tree: [ 'users', '' ],
        link: '/users'
      }
    ]);
  }

}
