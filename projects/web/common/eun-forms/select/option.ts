import {
  FocusableOption,
  FocusMonitor,
  FocusOptions,
  FocusOrigin
} from '@angular/cdk/a11y';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewEncapsulation
} from '@angular/core';


export interface EunOptionSelectEvent {

  value: any;
  selectBy: FocusOrigin;

}

@Component({
  selector: 'eun-option',
  template: `<ng-content></ng-content>`,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'eun-option',
    '[class.eun-option-selected]': 'selected',
    '[class.eun-option-disabled]': 'disabled',
    'tabindex': '-1',
    '(click)': 'select(\'mouse\')',
    '(keydown)': '_onKeydown($event)'
  }
})
export class EunOption implements AfterViewInit, OnDestroy, FocusableOption {

  @Input()
  value: any;

  @Input()
  selected = false;

  @Input()
  disabled = false;

  @Output('optionSelect')
  selectEvent = new EventEmitter<EunOptionSelectEvent>();

  constructor(
    public elRef: ElementRef<HTMLElement>,
    private focusMonitor: FocusMonitor
  ) { }

  ngAfterViewInit() {
    this.focusMonitor.monitor(this.elRef, false);
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.elRef);
  }

  _onKeydown(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'enter') {

      this.select('keyboard');

    }
  }

  focus(origin: FocusOrigin, options?: FocusOptions) {
    this.focusMonitor.focusVia(this.elRef.nativeElement, origin, options);
  }

  select(selectBy: FocusOrigin = 'program') {
    this.selectEvent.emit({ value: this.value, selectBy });
  }

  getLabel() {

    return this.elRef.nativeElement.textContent?.trim() || '';
  }

}
