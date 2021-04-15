import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Self
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { EunFormControl } from '../form-field';
import { EunInputAccessor, EUN_INPUT_ACCESSOR } from './input-accessor';


@Directive({
  selector: 'input[eunInput], textarea[eunInput], select[eunInput]',
  exportAs: 'eunInput',
  host: {
    'class': 'eun-input',
    '[disabled]': 'disabled',
    '[required]': 'required',
    '[attr.readonly]': 'readonly || null',
    '(click)': '$event.stopPropagation()',
    '(input)': 'mutation.next()'
  },
  providers: [
    {
      provide: EunFormControl,
      useExisting: EunInput
    }
  ]
})
export class EunInput implements EunFormControl<any>, OnChanges, OnDestroy {

  private inputAccessor!: EunInputAccessor;

  @Input()
  get value() {

    return this.inputAccessor.value;
  }
  set value(value: any) {
    if (value === this.value) return;

    this.inputAccessor.value = value;
    this.mutation.next();
  }

  get hasValue() {

    return Boolean(this.value);
  }

  @Input()
  get required() {

    return this._required;
  }
  set required(value: boolean) {
    value = coerceBooleanProperty(value);

    if (this.required === value) return;

    this._required = value;
    this.mutation.next();
  }
  private _required = false;

  @Input()
  get readonly() {

    return this._readonly;
  }
  set readonly(value: boolean) {
    value = coerceBooleanProperty(value);

    if (this.readonly === value) return;

    this.readonly = value;
    this.mutation.next();
  }
  private _readonly = false;

  @Input()
  get disabled() {
    if (typeof this.ngControl?.disabled === 'boolean') {

      return this.ngControl.disabled;
    }

    return this._disabled;
  }
  set disabled(value: boolean) {
    value = coerceBooleanProperty(value);

    if (this.disabled === value) return;

    this._disabled = value;

    if (this.focused) {
      this.focused = false;
      this.mutation.next();
    }
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

  focused = false;

  mutation = new Subject<void>();

  constructor(
    private elRef: ElementRef<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>,
    @Optional() @Self() public ngControl: NgControl|null,
    @Optional() @Inject(EUN_INPUT_ACCESSOR) inputAccessor: EunInputAccessor|null
  ) {
    this.inputAccessor = inputAccessor || elRef.nativeElement;
  }

  ngOnChanges() {
    this.mutation.next();
  }

  ngOnDestroy() {
    this.mutation.complete();
  }

  @HostListener('focus', [ 'true' ])
  @HostListener('blur', [ 'false' ])
  _onFocusChange(focused: boolean) {
    if (this.focused === focused) return;

    this.focused = focused;
    this.mutation.next();
  }

  focus(options?: FocusOptions) {
    if (this.readonly) return;

    this.elRef.nativeElement.focus(options);
  }

  onFormFieldClick() {
    if (!this.focused) {

      this.focus();

    }
  }

}
