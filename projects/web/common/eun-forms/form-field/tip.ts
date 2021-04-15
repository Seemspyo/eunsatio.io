import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';


@Component({
  selector: 'eun-tip',
  template: `
    <ng-content></ng-content>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'eun-tip'
  }
})
export class EunTip { }
