import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';


@Component({
  selector: 'deus-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: [ 'dashboard.component.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent { }
