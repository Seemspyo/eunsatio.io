import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EunError } from './error';
import { EunFormField } from './form-field';
import { EunLabel } from './label';
import { EunPrefix } from './prefix';
import { EunSuffix } from './suffix';
import { EunTip } from './tip';


@NgModule({
  declarations: [
    EunFormField,
    EunLabel,
    EunPrefix,
    EunSuffix,
    EunError,
    EunTip
  ],
  imports: [
    CommonModule
  ],
  exports: [
    EunFormField,
    EunLabel,
    EunPrefix,
    EunSuffix,
    EunError,
    EunTip
  ]
})
export class EunFormFieldModule { }
