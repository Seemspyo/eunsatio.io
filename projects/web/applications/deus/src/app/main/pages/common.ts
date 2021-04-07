import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { faTachometerAlt } from '@fortawesome/free-solid-svg-icons';
import { LayoutStore } from '../layout/layout.store';


@Component({
  selector: 'common-page',
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [`
    .common-page {
      display: block;
      width: 100%;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'common-page'
  }
})
export class CommonPage implements OnInit {

  constructor(
    private layout: LayoutStore
  ) { }

  ngOnInit() {
    this.layout.setDrawer([
      {
        type: 'routerLink',
        icon: faTachometerAlt,
        label: 'Dashboard',
        tree: [ '', 'dashboard' ],
        link: '/dashboard'
      }
    ]);
  }

}
