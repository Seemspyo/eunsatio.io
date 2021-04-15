import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';


@Component({
  selector: 'eun-error',
  template: `
    <ng-content></ng-content>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'eun-error'
  }
})
export class EunError { }
