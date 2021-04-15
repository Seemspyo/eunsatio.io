import { Directive } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Observable } from 'rxjs';


@Directive()
export abstract class EunFormControl<T> {

  abstract value: T|null;

  abstract hasValue: boolean; // to support empty array sort.

  abstract required: boolean;

  abstract readonly: boolean;

  abstract focused: boolean;

  abstract disabled: boolean;

  abstract ngControl: NgControl|null;

  abstract hasError: boolean;

  abstract mutation: Observable<void>;

  abstract onFormFieldClick(event: MouseEvent): void;

}
