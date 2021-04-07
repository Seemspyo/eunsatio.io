import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';


@Component({
  selector: 'user-list',
  templateUrl: 'user-list.component.html',
  styleUrls: [ 'user-list.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'user-list'
  }
})
export class UserListComponent {}
