import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EunOption } from './option';
import { EunSelect } from './select';


@NgModule({
  declarations: [
    EunSelect,
    EunOption
  ],
  imports: [
    CommonModule,
    A11yModule,
    FontAwesomeModule
  ],
  exports: [
    EunSelect,
    EunOption
  ]
})
export class EunSelectModule { }
