import { ComponentType } from '@angular/cdk/portal';
import { InjectionToken, TemplateRef } from '@angular/core';


export class FlipBarOption {

  duration? = 3e3;
  data?: any;
  /** `x` alignment, value can be 'left'|'center'|'right' or number within a range 0-1 */
  alignX?: 'left'|'center'|'right'|number = 'center';
  /** `x` alignment, value can be 'top'|'center'|'bottom' or number within a range 0-1 */
  alignY?: 'top'|'center'|'bottom'|number = 'bottom';

}

export const FLIP_BAR_DEFAULT_OPTIONS = new InjectionToken<FlipBarOption>('flip-bar.default-options');
export const FLIP_BAR_CONTENT = new InjectionToken<ComponentType<any>|TemplateRef<any>>('flip-bar.host-ref');
