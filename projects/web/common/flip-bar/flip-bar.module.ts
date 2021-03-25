import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlipBar, FlipBarComponent } from './flip-bar';


@NgModule({
  declarations: [
    FlipBarComponent
  ],
  imports: [
    CommonModule,
    PortalModule,
    OverlayModule
  ],
  exports: [
    FlipBarComponent
  ],
  providers: [
    FlipBar
  ]
})
export class FlipBarModule { }
