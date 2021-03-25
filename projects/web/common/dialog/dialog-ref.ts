/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 * 
 * original source: https://github.com/angular/components/blob/master/src/material/dialog/dialog-ref.ts
 */

import { FocusOrigin } from '@angular/cdk/a11y';
import { GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { DialogPosition } from './@dialog';
import { DialogContainer } from './dialog-container';
import { hasModifierKey } from '../utils/has-modifier-key';


let uniqueId = 0;

export class DialogRef<T, CloseEventT = any> {

  public componentInstance: T|null = null;

  public afterOpened = new Subject<void>();
  public beforeClosed = new Subject<CloseEventT>();
  public afterClosed = new Subject<CloseEventT>();
  public get backdropClick() {
    return this.overlayRef.backdropClick();
  }
  public get keyboardEvents() {
    return this.overlayRef.keydownEvents();
  }

  private closeFallbackTimeout?: number;
  private result?: CloseEventT;

  constructor(
    private overlayRef: OverlayRef,
    public containerInstance: DialogContainer,
    public readonly id: string = `dialog-${ uniqueId++ }`
  ) {

    containerInstance.id = id;

    containerInstance.animationStateChange.pipe(
      filter(event => event.state === 'afteropen'),
      take(1)
    )
    .subscribe(() => {

      this.afterOpened.next();
      this.afterOpened.complete();

    });

    containerInstance.animationStateChange.pipe(
      filter(event => event.state === 'afterclose'),
      take(1)
    )
    .subscribe(() => {

      window.clearTimeout(this.closeFallbackTimeout);
      this.disposeDialog();

    });

    overlayRef.detachments()
    .subscribe(() => {

      this.beforeClosed.next(this.result);
      this.beforeClosed.complete();

      this.afterClosed.next(this.result);
      this.afterClosed.complete();

      this.componentInstance = null;

      this.overlayRef.dispose();

    });

    overlayRef.keydownEvents()
    .pipe(
      filter(event => {
        return /^escape$/i.test(event.key) && !hasModifierKey(event)
      })
    )
    .subscribe(event => {

      event.preventDefault();

      closeDialogVia(this, 'keyboard');

    });

    overlayRef.backdropClick()
    .subscribe(() => closeDialogVia(this, 'mouse'));

  }

  public close(data?: CloseEventT) {
    this.result = data;

    this.containerInstance.animationStateChange.pipe(
      filter(event => event.state === 'startclose'),
      take(1)
    )
    .subscribe(event => {

      this.beforeClosed.next(data);
      this.beforeClosed.complete();
      this.overlayRef.detachBackdrop();

      this.closeFallbackTimeout = window.setTimeout(() => this.disposeDialog(), event.totalTime + 100);

    });

    this.containerInstance.startLeaveAnimation();
  }

  public setSize(width = '', height = '') {
    this.overlayRef.updateSize({ width, height });
    this.overlayRef.updatePosition();

    return this;
  }

  public setPosition(position?: DialogPosition) {
    let strategy = this.overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;

    if (position?.left || position?.right) {

      position.left ? strategy.left(position.left) : strategy.right(position.right);

    } else {

      strategy.centerHorizontally();

    }

    if (position?.top || position?.bottom) {

      position.top ? strategy.top(position.top) : strategy.bottom(position.bottom);

    } else {

      strategy.centerVertically();

    }

    this.overlayRef.updatePosition();

    return this;
  }

  public addPanelClass(classOrClassList: string|string[]) {
    this.overlayRef.addPanelClass(classOrClassList);

    return this;
  }

  public removePanelClass(classOrClassList: string|string[]) {
    this.overlayRef.removePanelClass(classOrClassList);

    return this;
  }

  private disposeDialog() {
    this.overlayRef.dispose();
  }

}

export function closeDialogVia<CloseEventT>(ref: DialogRef<any>, interactionType: FocusOrigin, result?: CloseEventT) {
  if (ref.containerInstance instanceof DialogContainer) {

    ref.containerInstance.closeInteractionType = interactionType;

  }

  return ref.close(result);
}
