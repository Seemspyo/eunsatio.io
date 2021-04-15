import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { LayoutModule } from '@angular/cdk/layout';
import { PlatformModule } from '@angular/cdk/platform';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MainRoutingModule } from './main-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InventoryModule } from 'common/inventory';
import { SwiperModule } from 'swiper/angular';

import { MainComponent } from './main.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './common/dashboard/dashboard.component';
import { CommonPage } from './pages/common';

import { LayoutStore } from './layout/layout.store';
import { UploadAPI } from 'common/api/upload-api';


@NgModule({
  declarations: [
    MainComponent,
    LayoutComponent,

    CommonPage,
    DashboardComponent
  ],
  imports: [
    CommonModule,
    A11yModule,
    OverlayModule,
    LayoutModule,
    PlatformModule,
    FormsModule,
    ReactiveFormsModule,

    MainRoutingModule,
    FontAwesomeModule,
    InventoryModule,
    SwiperModule
  ],
  providers: [
    LayoutStore,
    UploadAPI
  ]
})
export class MainModule { }
