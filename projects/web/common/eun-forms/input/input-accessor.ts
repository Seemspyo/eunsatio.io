import { InjectionToken } from '@angular/core';

export interface EunInputAccessor {

  value: any;

}

export const EUN_INPUT_ACCESSOR = new InjectionToken<EunInputAccessor>('eun-input.accessor');
