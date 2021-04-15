import {
  Directive
} from '@angular/core';


@Directive({
  selector: '[eunPrefix]',
  host: {
    'class': 'eun-prefix'
  }
})
export class EunPrefix { }
