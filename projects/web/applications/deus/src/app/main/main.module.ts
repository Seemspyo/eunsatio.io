import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MainRoutingModule } from './main-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InventoryModule } from 'common/inventory';

import { MainComponent } from './main.component';
import { TopComponent } from './top/top.component';


@NgModule({
  declarations: [
    MainComponent,
    TopComponent
  ],
  imports: [
    CommonModule,
    A11yModule,
    OverlayModule,
    FormsModule,
    ReactiveFormsModule,

    MainRoutingModule,
    FontAwesomeModule,
    InventoryModule
  ]
})
export class MainModule { }
