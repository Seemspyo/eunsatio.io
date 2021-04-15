import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';


@Component({
  selector: 'eun-label',
  template: `
    <ng-content></ng-content>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'eun-label'
  }
})
export class EunLabel { }
