import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  HostListener,
  QueryList,
  ViewEncapsulation
} from '@angular/core';
import { merge } from 'rxjs';
import { EunError } from './error';
import { EunFormControl } from './form-control';
import { EunFormMissingControlError } from './form-errors';
import { EunLabel } from './label';
import { EunPrefix } from './prefix';
import { EunSuffix } from './suffix';
import { EunTip } from './tip';


@Component({
  selector: 'eun-form-field',
  templateUrl: 'form-field.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'eun-form-field eun-styles',
    '[class.eun-form-field-focused]': 'control.focused',
    '[class.eun-form-field-error]': 'control.hasError',
    '[class.eun-form-field-float]': 'control.hasValue || control.focused',
    '[class.eun-form-field-disabled]': 'control.disabled'
  }
})
export class EunFormField implements AfterContentInit, AfterViewInit {

  @ContentChild(EunLabel)
  _labelChild?: EunLabel;

  @ContentChildren(EunPrefix)
  _prefixChildren!: QueryList<EunPrefix>;

  @ContentChildren(EunSuffix)
  _suffixChildren!: QueryList<EunSuffix>;

  @ContentChildren(EunError)
  _errorChildren!: QueryList<EunError>;

  @ContentChildren(EunTip)
  _tipChildren!: QueryList<EunTip>;

  @ContentChild(EunFormControl)
  control!: EunFormControl<any>;

  constructor(
    private changeDetector: ChangeDetectorRef
  ) { }

  ngAfterContentInit() {
    if (!this.control) {

      throw new EunFormMissingControlError();
    }

    merge(
      this._prefixChildren.changes,
      this._suffixChildren.changes,
      this._errorChildren.changes,
      this._tipChildren.changes,
      this.control.mutation
    ).subscribe(() => this.changeDetector.markForCheck());
  }

  ngAfterViewInit() {
    this.changeDetector.detectChanges();
  }

  /** @docs-private */
  _getMessageType() {

    return this._errorChildren.length > 0 && this.control.hasError ? 'error' : 'tip';
  }

  /**
   * @docs-private
   * notifying click event to first control only.
   **/
  @HostListener('click', [ '$event' ])
  onFieldClick(event: MouseEvent) {
    this.control.onFormFieldClick(event);
  }

}
