import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';


@Component({
  selector: 'deus',
  template: `<router-outlet></router-outlet>`,
  styleUrls: [ 'app.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'deus'
  }
})
export class AppComponent { }
