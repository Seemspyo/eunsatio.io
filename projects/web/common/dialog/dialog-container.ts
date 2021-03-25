/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 * 
 * original source: https://github.com/angular/components/blob/master/src/material/dialog/dialog-container.ts
 */

import { AnimationEvent } from '@angular/animations';
import {
  ConfigurableFocusTrapFactory,
  FocusMonitor,
  FocusOrigin,
  FocusTrap
} from '@angular/cdk/a11y';
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  ComponentPortal,
  TemplatePortal
} from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  DialogAnimationEvent,
  DialogConfig,
  DialogLifecycle
} from './@dialog';
import { dialogContainerAnimation } from './dialog-animation';


@Component({
  selector: 'dialog-container',
  template: `
    <ng-template cdkPortalOutlet></ng-template>
  `,
  styles: [
    `
    .dialog-container {
      outline: none;
      width: 100%; height: 100%;
    }
    `
  ],
  host: {
    'class': 'dialog-container',
    'tabindex': '-1',
    'aria-modal': 'true',
    '[id]': 'id',
    '[attr.aria-label]': 'config.ariaLabel',
    '[@dialogContainer]': 'state',
    '(@dialogContainer.start)': 'onAnimationStart($event)',
    '(@dialogContainer.done)': 'onAnimationEnd($event)'
  },
  animations: [
    dialogContainerAnimation
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogContainer extends BasePortalOutlet implements DialogLifecycle {

  public state: 'void'|'enter'|'leave' = 'enter';

  public animationStateChange = new EventEmitter<DialogAnimationEvent>();

  @ViewChild(CdkPortalOutlet, { static: true })
  public portalOutlet!: CdkPortalOutlet;

  public id!: string;
  private focusTrap?: FocusTrap;
  private activeElBeforeDialogWasOpened?: any;
  public closeInteractionType?: FocusOrigin;

  constructor(
    private hostElRef: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private doc: Document,
    private changeDetector: ChangeDetectorRef,
    public config: DialogConfig,
    private focusTrapFactory: ConfigurableFocusTrapFactory,
    private focusMonitor?: FocusMonitor
  ) { super(); }

  afterContentAttached() {

    const hostEl = this.hostElRef.nativeElement;

    this.focusTrap = this.focusTrapFactory.create(hostEl);
    this.activeElBeforeDialogWasOpened = this.doc?.activeElement;

    if (hostEl instanceof HTMLElement) {

      hostEl.focus();

    }

  }

  public attachComponentPortal<C>(portal: ComponentPortal<C>) {

    return this.portalOutlet.attachComponentPortal(portal);
  }

  public attachTemplatePortal<T>(portal: TemplatePortal<T>) {

    return this.portalOutlet.attachTemplatePortal(portal);
  }

  public startLeaveAnimation() {
    this.state = 'leave';
    this.changeDetector.markForCheck();
  }

  public onAnimationStart({ toState, totalTime }: AnimationEvent) {
    switch (toState) {
      case 'enter': {

        this.animationStateChange.emit({ state: 'startopen', totalTime });

        break;
      }
      case 'leave':
      case 'void': {

        this.animationStateChange.emit({ state: 'startclose', totalTime });

        break;
      }
    }
  }

  public onAnimationEnd({ toState, totalTime }: AnimationEvent) {
    switch (toState) {
      case 'enter': {

        this.trapFocus();
        this.animationStateChange.emit({ state: 'afteropen', totalTime });

        break;
      }
      case 'leave': {
        
        this.restoreFocus();
        this.animationStateChange.emit({ state: 'afterclose', totalTime });

        break;
      }
    }
  }

  private trapFocus() {
    if (this.config.autoFocus) {

      this.focusTrap?.focusInitialElementWhenReady();

    } else if (!this.hasFocus()) {

      this.hostElRef.nativeElement.focus();

    }
  }

  private restoreFocus() {
    const prevEl = this.activeElBeforeDialogWasOpened;

    if (this.config.restoreFocus && prevEl instanceof HTMLElement) {

      const
      activeEl = this.doc.activeElement,
      hostEl = this.hostElRef.nativeElement;

      if (!activeEl || activeEl === this.doc.body || activeEl === hostEl || hostEl.contains(activeEl)) {

        if (this.focusMonitor) {

          this.focusMonitor.focusVia(prevEl, this.closeInteractionType!);
          this.closeInteractionType = void 0;

        } else {

          prevEl.focus();

        }
        
      }

    }
  }

  private hasFocus() {
    const
    hostEl = this.hostElRef.nativeElement,
    activeEl = this.doc.activeElement;

    return hostEl === activeEl || hostEl.contains(activeEl);
  }

}
