import { ScrollStrategy } from '@angular/cdk/overlay';
import { InjectionToken, ViewContainerRef } from '@angular/core';


export const DIALOG_CONFIG = new InjectionToken<DialogConfig>('dialog.config');
export const DIALOG_DATA = new InjectionToken<any>('dialog.data');

type ClassExpression = string | string[];

export class DialogConfig<DataT = any> {

  viewContainerRef?: ViewContainerRef;
  id?: string;
  ariaLabel?: string;
  panelClass?: ClassExpression = '';
  hasBackdrop?: boolean = true;
  backdropClass?: ClassExpression = '';
  width?: string;
  height?: string;
  maxWidth?: number|string = '100%';
  maxHeight?: number|string;
  position?: DialogPosition;
  data?: DataT|null = null;
  autoFocus?: boolean = true;
  restoreFocus?: boolean = true;
  scrollStrategy?: ScrollStrategy;

}

export interface DialogPosition {

  top?: string;
  right?: string;
  bottom?: string;
  left?: string;

}

export interface DialogAnimationEvent {

  state: 'startopen'|'afteropen'|'startclose'|'afterclose';
  totalTime: number;

}

export interface DialogLifecycle {

  afterContentAttached(): void;

}
