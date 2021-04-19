import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Paginator } from './paginator';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SwiperModule } from 'swiper/angular';
import { EunFormFieldModule } from 'common/eun-forms/form-field';
import { EunInputModule } from 'common/eun-forms/input';
import { EunSelectModule } from 'common/eun-forms/select';


@NgModule({
  declarations: [ Paginator ],
  imports: [
    CommonModule,
    FormsModule,

    FontAwesomeModule,
    SwiperModule,
    EunFormFieldModule,
    EunInputModule,
    EunSelectModule
  ],
  exports: [ Paginator ]
})
export class PaginatorModule { }
