import {
  Directive
} from '@angular/core';


@Directive({
  selector: '[eunSuffix]',
  host: {
    'class': 'eun-suffix'
  }
})
export class EunSuffix { }
