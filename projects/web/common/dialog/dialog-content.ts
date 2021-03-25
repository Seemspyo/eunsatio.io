import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  Input,
  ViewEncapsulation
} from '@angular/core';
import { closeDialogVia, DialogRef } from './dialog-ref';


@Directive({
  selector: '[dialogClose]',
  exportAs: 'dialogClose',
  host: {
    '(click)': 'onInteraction($event)',
    'type': 'button'
  }
})
export class DialogClose {

  @Input('dialogClose')
  public dialogResult: any;

  constructor(
    public dialogRef: DialogRef<any>
  ) { }

  public onInteraction(event: MouseEvent) {
    closeDialogVia(this.dialogRef, event.screenX === 0 && event.screenY === 0 ? 'keyboard' : 'mouse', this.dialogResult);
  }

}


@Component({
  selector: 'dialog-content',
  template: `
    <ng-content></ng-content>
  `,
  styles: [
    `
    .dialog-content {
      width: 100%;
      max-width: 100%; max-height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
    }
    `
  ],
  host: {
    'class': 'dialog-content'
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogContent { }
