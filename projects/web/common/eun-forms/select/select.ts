import { AnimationEvent } from '@angular/animations';
import { FocusKeyManager, FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Output,
  QueryList,
  Self,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { hasModifierKey } from '@eunsatio.io/util/dist/has-modifier-key';
import { VOID } from '@eunsatio.io/util/dist/void';
import { faCaretSquareDown } from '@fortawesome/free-solid-svg-icons';
import { SubscriptionContainer } from 'common/rxjs/subscription-container';
import { Subject } from 'rxjs';
import { EunFormControl } from '../form-field';
import { EunOption } from './option';
import { panelAnimation } from './select-animations';


@Component({
  selector: 'eun-select',
  templateUrl: 'select.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'eun-select',
    '[attr.tabindex]': 'tabIndex'
  },
  animations: [
    panelAnimation
  ],
  providers: [
    {
      provide: EunFormControl,
      useExisting: EunSelect
    },
    SubscriptionContainer
  ]
})
export class EunSelect
implements EunFormControl<any>, ControlValueAccessor, AfterContentInit, OnChanges, OnDestroy
{

  public icons = {
    dropdown: faCaretSquareDown
  }

  @Input()
  get multiple() {

    return this._multiple;
  }
  set multiple(value: boolean) {
    value = coerceBooleanProperty(value);

    if (this.multiple === value) return;

    this._multiple = value;

    if (this.multiple) {

      this.value = [ this.value ]
      this.selection = this.selection ? [ this.selection as EunOption ] : []

    } else {

      (this.selection as EunOption[]).slice(1).forEach(option => option.selected = false);

      this.value = this.value[0];
      this.selection = (this.selection as EunOption[])[0] || null;

    }

    this.mutation.next();
  }
  private _multiple = false;

  @Input()
  get value() {

    return this._value;
  }
  set value(value: any) {
    if (this.value === value) return;

    if (this.isSelectionIterable(this.selection)) {

      this._value = value || []

      if (Array.isArray(this.value)) {
        this.selection = this.value && this.options?.filter(option => {

          return option.selected = this.value.includes(option.value);
        }) || null;
        this.value = this.selection?.map(option => option.value);
      }

    } else {

      if (this.selection) this.selection.selected = false;

      this._value = value;
      this.selection = this.options?.find(option => option.value === this.value) || null;

      if (this.selection) this.selection.selected = true;

    }

    this.mutation.next();
    this.changeDetector.markForCheck();
  }
  private _value: any;

  get hasValue() {

    return Boolean(this.isSelectionIterable(this.selection) ? this.selection.length : this.selection);
  }

  @Input()
  get readonly() {

    return this._readonly;
  }
  set readonly(value: boolean) {
    value = coerceBooleanProperty(value);

    if (this.readonly === value) return;

    this._readonly = value;
    this.changeDetector.markForCheck();
  }
  private _readonly = false;

  @Input()
  get required() {

    return this._required;
  }
  set required(value: boolean) {
    value = coerceBooleanProperty(value);

    if (this.required === value) return;

    this._required = value;
    this.changeDetector.markForCheck();
  }
  private _required = false;

  @Input()
  get disabled() {

    return this._disabled;
  }
  set disabled(value: boolean) {
    value = coerceBooleanProperty(value);

    if (this.disabled === value) return;

    this._disabled = value;
    this.changeDetector.markForCheck();
  }
  private _disabled = false;

  get hasError() {
    if (!this.ngControl?.dirty) {

      return false;
    }

    if (this.ngControl.invalid) {

      return true;
    }

    return false;
  }
  selection: EunOption|EunOption[]|null = null;

  @Output('selectionChange')
  selectionChangeEvent = new EventEmitter<EunOption|EunOption[]|null>();

  mutation = new Subject<void>();
  focused = false;
  tabIndex!: number;

  @ViewChild('OptionPanel')
  optionPanelTemplateRef!: TemplateRef<any>;
  private portal: TemplatePortal<any>|null = null;
  private panelOverlayRef: OverlayRef|null = null;
  public panelState: 'opened'|'closed' = 'closed';
  private fromFocus = false;
  private closePanelBy: FocusOrigin = null;

  @ContentChildren(EunOption, { descendants: true })
  options?: QueryList<EunOption>;
  private keyManager!: FocusKeyManager<EunOption>;

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private viewRef: ViewContainerRef,
    private changeDetector: ChangeDetectorRef,
    private overlay: Overlay,
    @Optional() @Self() public ngControl: NgControl|null,
    @Attribute('tabindex') tabIndex: string,
    private focusMonitor: FocusMonitor,
    private subscription: SubscriptionContainer
  ) {
    if (this.ngControl) {

      /**
       * instead of `NG_VALUE_ACCESSOR`, provide value accessor here to avoid
       * circular imports.
       * https://github.com/angular/components/blob/master/src/material/select/select.ts
       */
      this.ngControl.valueAccessor = this;

    }

    this.tabIndex = parseInt(tabIndex) || 0;
  }

  ngAfterContentInit() {
    { // set focus key manager
      this.keyManager = new FocusKeyManager(this.options!)
                        .withWrap()
                        .withTypeAhead()
                        .withHomeAndEnd()
                        .withVerticalOrientation(true)
                        .withAllowedModifierKeys(['altKey','ctrlKey','shiftKey','metaKey']);

      this.keyManager.tabOut.subscribe(() => this.closePanel('keyboard')); 
    }

    { // set options
      this.watchOptionSelect();
      this.options!.changes.subscribe(() => this.watchOptionSelect());
    }
  }

  ngOnChanges() {
    this.mutation.next();
  }

  ngOnDestroy() {
    this.mutation.complete();
  }

  writeValue(value: any) {
    this.value = value;
  }

  onFormFieldClick() {
    this.openPanel();
  }

  /** @docs-private */
  _onChange: (value: any) => void = VOID;
  registerOnChange(fn: (value: any) => void) {
    this._onChange = fn;
    this.changeDetector.markForCheck();
  }

  _onTouched: () => void = VOID;
  registerOnTouched(fn: () => void) {
    this._onTouched = fn;
    this.changeDetector.markForCheck();
  }

  _onPanelAnimation(event: AnimationEvent) {
    const fromTo = [ event.fromState, event.toState ].join('=>');

    switch (fromTo) {

      case 'opened=>closed': {
        if (event.phaseName === 'done') {

          this.disposePanel();

        }
        break;
      }

      case 'closed=>opened': {
        if (event.phaseName === 'start') {

          this.focusActiveItem();

        }
        break;
      }

    }
  }

  _getHostWidth() {

    return this.elRef.nativeElement.offsetWidth;
  }

  @HostListener('focus', [ 'true' ])
  @HostListener('blur', [ 'false' ])
  _onFocusChange(focused: boolean) {
    if (this.focused === focused) return;
    if (!focused && this.panelOverlayRef) return;

    this.focused = focused;
    this.mutation.next();
  }

  @HostListener('keydown', [ '$event' ])
  _onClickLike(event: KeyboardEvent) {
    if (hasModifierKey(event)) return;

    const key = event.key.toLowerCase();

    switch (key) {

      case 'enter':
        this.openPanel();
        break;

      case 'arrowup':
      case 'arrowdown': {
        if (!this.options!.length) break;

        let index = this.getFirstActiveItemIndex() + (key === 'arrowdown' ? +1 : -1);

        if (index < 0) index = this.options!.length - 1;
        if (index >= this.options!.length) index = 0;

        this.selectOption(this.options!.get(index)!, 'program');
        break;
      }

    }
  }

  _onPanelKeydown(event: KeyboardEvent) {
    if (hasModifierKey(event)) return;

    const key = event.key.toLowerCase();

    switch (key) {

      case 'escape': {
        event.preventDefault();
        this.closePanel('keyboard');
        break;
      }

      default: {
        if ([ 'arrowup', 'arrowdown' ].includes(key)) {

          this.keyManager.setFocusOrigin('keyboard');

        }

        this.keyManager.onKeydown(event);
      }

    }
  }

  public getLabel() {
    if (!this.selection) {

      return '';
    }

  return this.isSelectionIterable(this.selection) ? this.selection.map(option => option.getLabel()).join(', ') : this.selection.getLabel();
  }

  public openPanel() {
    if (this.panelOverlayRef) return;

    const overlayRef = this.overlay.create({
      positionStrategy: this.getPositionStrategy(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    overlayRef.attach(this.getPortal());
    this.fromFocus = this.focused;
    this.focused = true;
    this.setPanelState('opened');

    overlayRef.backdropClick().subscribe(() => this.closePanel('mouse'));

    this.panelOverlayRef = overlayRef;
  }

  public closePanel(closeBy: FocusOrigin = 'program') {
    this._onTouched();

    if (closeBy === 'mouse') { // pointer action will not restore focus, so blur before animation ends.
      this.focused = false;
    }
    this.closePanelBy = closeBy;

    this.setPanelState('closed');
  }

  public disposePanel() {
    this.panelOverlayRef?.dispose();
    this.panelOverlayRef = null;

    if (this.fromFocus && this.closePanelBy !== 'mouse') {

      this.focused = false; // blur after animation ends.
      this.fromFocus = false;
      this.focusMonitor.focusVia(this.elRef, 'program');

    }

    this.closePanelBy = null;
  }

  public focusActiveItem() {
    const index = this.getFirstActiveItemIndex();

    this.keyManager.setFocusOrigin('program');

    if (index < 0) {

      this.keyManager.setFirstItemActive();

    } else {

      this.keyManager.setActiveItem(index);

    }

    if (!this.keyManager.activeItem) {

      this.focusMonitor.focusVia(this.elRef, 'program');

    }
  }

  private getPositionStrategy() {

    return this.overlay
    .position()
    .flexibleConnectedTo(this.elRef)
    .withLockedPosition()
    .withPositions([
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'top'
      },
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'bottom'
      }
    ])
    .withTransformOriginOn('.eun-select-option-panel');
  }

  private getPortal() {

    return this.portal = this.portal || new TemplatePortal(this.optionPanelTemplateRef, this.viewRef);
  }

  private setPanelState(state: 'opened'|'closed') {
    this.panelState = state;
    this.changeDetector.markForCheck();
  }

  private watchOptionSelect() {
    this.subscription.disposeAll();

    this.subscription.add(

      ...this.options!.map(option => option.selectEvent.subscribe(event => this.selectOption(option, event.selectBy)))

    );
  }

  private selectOption(option: EunOption, selectBy: FocusOrigin) {
    if (this.multiple) {

      const options = this.selection as EunOption[];

      if (option.selected) {

        options.splice(options.indexOf(option), 1);
        option.selected = false;

      } else {

        options.push(option);
        option.selected = true;

      }

      this.value = options.map(option => option.value);

    } else {
      
      if (this.selection) {

        (this.selection as EunOption).selected = false;

      }

      this.selection = option;
      this.value = option.value;
      option.selected = true;
      this.closePanel(selectBy);

    }

    this.selectionChangeEvent.emit(this.selection);
    this._onChange(this.value);
  }

  private isSelectionIterable(selection: EunOption[]|EunOption|null): selection is EunOption[] {

    return this.multiple;
  }

  private getFirstActiveItemIndex() {
    const selection: EunOption|null = this.isSelectionIterable(this.selection) ? this.selection[0] : this.selection;

    return this.options!.reduce((index, option, i) => {

      return option === selection ? i : index;
    }, -1);
  }

}
