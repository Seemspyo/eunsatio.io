/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 * 
 * original source: https://github.com/angular/components/blob/master/src/material/dialog/dialog.ts
 */

import {
  ComponentType,
  Overlay,
  OverlayConfig,
  OverlayContainer,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import {
  Inject,
  Injectable,
  Injector,
  OnDestroy,
  Optional,
  SkipSelf,
  TemplateRef
} from '@angular/core';
import { Subject } from 'rxjs';
import { DialogConfig, DIALOG_CONFIG, DIALOG_DATA } from './@dialog';
import { DialogContainer } from './dialog-container';
import { DialogRef } from './dialog-ref';


@Injectable()
export class Dialog implements OnDestroy {

  private ariaHiddenElMap = new Map<Element, string|null>();

  private activeDialogListOfThis: DialogRef<any>[] = []
  public get activeDialogList(): DialogRef<any>[] {

    return this.parentDialog?.activeDialogList || this.activeDialogListOfThis;
  }

  private afterOpenedOfThis = new Subject<DialogRef<any>>();
  public get afterOpened(): Subject<DialogRef<any>> {

    return this.parentDialog?.afterOpened || this.afterOpenedOfThis;
  }

  private afterAllClosedOfThis = new Subject<void>();
  public get afterAllClosed(): Subject<void> {

    return this.parentDialog?.afterAllClosed || this.afterAllClosedOfThis;
  }

  constructor(
    private overlay: Overlay,
    private Injector: Injector,
    private overlayContainer: OverlayContainer,
    @Optional() @SkipSelf() private parentDialog?: Dialog,
    @Optional() @Inject(DIALOG_CONFIG) private defaultConfigs?: DialogConfig
  ) { }

  ngOnDestroy() {
    this.closeAll();
    this.afterOpenedOfThis.complete();
    this.afterAllClosedOfThis.complete();
  }

  public open<T, D = any, R = any>(template: TemplateRef<T>, config?: DialogConfig<D>): DialogRef<T, R>;
  public open<T, D = any, R = any>(component: ComponentType<T>, config?: DialogConfig<D>): DialogRef<T, R>;
  public open<T, D = any, R = any>(componentOrTemplateRef: ComponentType<T> | TemplateRef<T>, config?: DialogConfig<D>): DialogRef<T, R> {
    config = this.withDefaultConfig(config);

    if (config.id && this.getDialogById(config.id)) {

      throw new Error(`Dialog with id ${ config.id } already exists`);
    }

    const overlayRef = this.createOverlay(config);

    const dialogContainer = this.attachDialogContainer(overlayRef, config);

    const dialogRef = this.attachDialog<T, R>(componentOrTemplateRef, dialogContainer, overlayRef, config);

    if (!this.activeDialogList.length) {

      this.hideNonDialogContentFromAssistiveTechnology();

    }

    this.activeDialogList.push(dialogRef);
    dialogRef.afterClosed.subscribe(() => this.disposeDialog(dialogRef));
    this.afterOpened.next(dialogRef);

    dialogContainer.afterContentAttached();

    return dialogRef;
  }

  public getDialogById(id: string): DialogRef<any> | void {

    return this.activeDialogList.find(ref => ref.id === id);
  }

  public closeAll() {
    for (const ref of this.activeDialogList) {

      ref.close();

    }
  }

  private createOverlay(dialogConfig: DialogConfig) {
    const {
      scrollStrategy = this.overlay.scrollStrategies.block(),
      panelClass,
      backdropClass,
      hasBackdrop,
      maxWidth,
      maxHeight
    } = dialogConfig;

    const config = new OverlayConfig({
      positionStrategy: this.overlay.position().global(),
      scrollStrategy,
      panelClass,
      backdropClass,
      hasBackdrop,
      maxWidth,
      maxHeight,
      disposeOnNavigation: false
    });

    return this.overlay.create(config);
  }

  private attachDialogContainer(overlayRef: OverlayRef, config: DialogConfig) {
    const customInjector = config?.viewContainerRef?.injector;

    const injector = Injector.create({
      parent: customInjector || this.Injector,
      providers: [
        { provide: DialogConfig, useValue: config }
      ]
    });

    const containerPortal = new ComponentPortal(DialogContainer, config.viewContainerRef, injector);

    return overlayRef.attach(containerPortal).instance;
  }

  private attachDialog<T, R>(
    componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    dialogContainer: DialogContainer,
    overlayRef: OverlayRef,
    config: DialogConfig
  ) {
    const dialogRef = new DialogRef<T, R>(overlayRef, dialogContainer, config.id);

    if (componentOrTemplateRef instanceof TemplateRef) {

      const templatePortal = new TemplatePortal<T>(componentOrTemplateRef, null!, {
        $implicit: config.data,
        dialogRef
      } as any);

      dialogContainer.attachTemplatePortal(templatePortal);

    } else {

      const customInjector = config?.viewContainerRef?.injector;

      const injector = Injector.create({
        parent: customInjector || this.Injector,
        providers: [
          { provide: DialogContainer, useValue: dialogContainer },
          { provide: DIALOG_DATA, useValue: config.data },
          { provide: DialogRef, useValue: dialogRef }
        ]
      });

      const componentPortal = new ComponentPortal(componentOrTemplateRef, config.viewContainerRef, injector);

      const contentRef = dialogContainer.attachComponentPortal<T>(componentPortal);

      dialogRef.componentInstance = contentRef.instance;

    }

    dialogRef
    .setSize(config.width, config.height)
    .setPosition(config.position);

    return dialogRef;
  }

  private disposeDialog(dialogRef: DialogRef<any>) {
    const index = this.activeDialogList.indexOf(dialogRef);

    if (index >= 0) {

      this.activeDialogList.splice(index, 1);

      if (!this.activeDialogList.length) {

        for (const [ el, prevValue ] of this.ariaHiddenElMap) {

          if (prevValue) {

            el.setAttribute('aria-hidden', prevValue);

          } else {

            el.removeAttribute('aria-hidden');

          }

        }

        this.ariaHiddenElMap.clear();
        this.afterAllClosed.next();

      }

    }
  }

  private withDefaultConfig(config?: DialogConfig) {
    return { ...(this.defaultConfigs || new DialogConfig()), ...config }
  }

  private hideNonDialogContentFromAssistiveTechnology() {
    const overlayContainerEl = this.overlayContainer.getContainerElement();

    if (overlayContainerEl.parentElement) {

      const siblings = overlayContainerEl.parentElement.children;

      for (const sibling of Array.from(siblings)) {

        if (
          sibling !== overlayContainerEl
          && ![ 'SCRIPT', 'STYLE' ].includes(sibling.nodeName)
          && !sibling.hasAttribute('aria-live')
        ) {

          this.ariaHiddenElMap.set(sibling, sibling.getAttribute('aria-hidden'));
          sibling.setAttribute('aria-hidden', 'true');

        }

      }

    }
  }

}
