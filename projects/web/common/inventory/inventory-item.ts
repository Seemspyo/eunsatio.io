import {
  FocusableOption,
  FocusMonitor,
  FocusOptions,
  FocusOrigin
} from '@angular/cdk/a11y';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy
} from '@angular/core';


@Directive({
  selector: '[inventoryItem]',
  host: {
    'class': 'inventory-item'
  }
})
export class InventoryItem implements AfterViewInit, OnDestroy, FocusableOption {

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private focusMonitor: FocusMonitor
  ) {}

  ngAfterViewInit() {
    this.focusMonitor.monitor(this.elRef, false);
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.elRef);
  }

  focus(origin: FocusOrigin, options?: FocusOptions) {
    this.focusMonitor.focusVia(this.elRef.nativeElement, origin, options);
  }

  getLabel() {

    return this.elRef.nativeElement.textContent?.trim() || '';
  }

}
