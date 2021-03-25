import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { NgModule } from '@angular/core';
import { Dialog } from './dialog';
import { DialogContainer } from './dialog-container';
import { DialogClose, DialogContent } from './dialog-content';


@NgModule({
  declarations: [
    DialogContainer,
    DialogContent,
    DialogClose
  ],
  exports: [
    DialogContainer,
    DialogContent,
    DialogClose
  ],
  imports: [
    OverlayModule,
    PortalModule
  ],
  providers: [
    Dialog
  ]
})
export class DialogModule { }
