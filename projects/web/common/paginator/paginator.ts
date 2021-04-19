import {
  coerceBooleanProperty,
  coerceNumberProperty
} from '@angular/cdk/coercion';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Integral } from '@eunsatio.io/util/dist/type-def';
import {
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faAngleLeft,
  faAngleRight
} from '@fortawesome/free-solid-svg-icons';
import { SwiperComponent } from 'swiper/angular';


export class PageChangeEvent {

  constructor(
    public index = 0,
    public previousIndex = 0,
    public size = 0
  ) { }

}

export interface PaginatorOptions {

  goToLabel?: string;
  sizeOptionLabel?: string;
  formatLabel?: (index: number, size: number, length: number) => string;

}

export const PAGINATOR_OPTIONS = new InjectionToken<PaginatorOptions>('paginator.options');

@Component({
  selector: 'paginator',
  templateUrl: 'paginator.html',
  styleUrls: [ 'paginator.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'paginator'
  }
})
export class Paginator {

  public icons = {
    first: faAngleDoubleLeft,
    last: faAngleDoubleRight,
    prev: faAngleLeft,
    next: faAngleRight
  }

  @Input()
  get pageIndex() {

    return this._pageIndex;
  }
  set pageIndex(index: number) {
    this.setPageIndex(index, 0);
  }
  private _pageIndex = 0;

  @Input()
  get pageLength() {

    return this._pageLength;
  }
  set pageLength(length: number) {
    length = Math.max(0, coerceNumberProperty(length, 0));

    if (this.pageLength === length) return;

    this._pageLength = length;
    this.pageIndex = Math.min(this.pageIndex, this._getMaxPageIndex());

    this.changeDetector.markForCheck();
  }
  private _pageLength = 0;

  @Input()
  get pageSize() {

    return this._pageSize;
  }
  set pageSize(value: number) {
    value = coerceNumberProperty(value);

    if (this.pageSize === value) return;

    this._pageSize = value;
    this.pageIndex = Math.min(this.pageIndex, this._getMaxPageIndex());
  }
  private _pageSize = 10;

  @Input()
  pageSizeOptions: number[] = []

  @Input()
  get hideFirstLastButton() {

    return this._hideFirstLastButton;
  }
  set hideFirstLastButton(value: boolean) {
    this.setBooleanProperty('hideFirstLastButton', value);
  }
  private _hideFirstLastButton = false;

  @Input()
  get hidePrevNextButton() {

    return this._hidePrevNextButton;
  }
  set hidePrevNextButton(value: boolean) {
    this.setBooleanProperty('hidePrevNextButton', value);
  }
  private _hidePrevNextButton = false;

  @Input()
  get hideConsole() {

    return this._hideConsole;
  }
  set hideConsole(value: boolean) {
    this.setBooleanProperty('hideConsole', value);
  }
  private _hideConsole = false;

  @Input()
  get hideGoTo() {

    return this._hideGoTo;
  }
  set hideGoTo(value: boolean) {
    this.setBooleanProperty('hideGoTo', value);
  }
  private _hideGoTo = false;

  @Input()
  get hideSizeOption() {

    return this._hideSizeOption;
  }
  set hideSizeOption(value: boolean) {
    this.setBooleanProperty('hideSizeOption', value);
  }
  private _hideSizeOption = false;

  @Input()
  get hideDisplay() {

    return this._hideDisplay;
  }
  set hideDisplay(value: boolean) {
    this.setBooleanProperty('hideDisplay', value);
  }
  private _hideDisplay = false;

  @Output('page')
  pageChange = new EventEmitter<PageChangeEvent>();

  @ViewChild(SwiperComponent)
  pageSlideRef?: SwiperComponent;

  public options!: Integral<PaginatorOptions>;

  constructor(
    private changeDetector: ChangeDetectorRef,
    @Optional() @Inject(PAGINATOR_OPTIONS) options: PaginatorOptions|null
  ) {
    this.options = {
      goToLabel: 'go to',
      sizeOptionLabel: 'items per page',
      formatLabel(i, size, length) {

        return `${ i * size + 1 }-${ Math.min((i + 1) * size, length) } of ${ length }`;
      },
      ...options
    }
  }

  public setPageIndex(index: number, slideSpeed: number = 500) {
    index = Math.max(0, Math.min(this._getMaxPageIndex(), coerceNumberProperty(index, 0)));

    const prevIndex = this.pageIndex;

    this._pageIndex = index;

    this.changeDetector.markForCheck();
    this.pageChange.emit(new PageChangeEvent(this.pageIndex, prevIndex, this.pageSize));

    setTimeout(() => this.pageSlideRef?.swiperRef.slideTo(this.pageIndex, slideSpeed)); // pass thread to renderer
  }

  _getPageIterator() {
    const
    iterator: number[] = [],
    pageCount = this._getMaxPageIndex() + 1;

    for (let n = 1; n <= pageCount; n++) {
      iterator.push(n);
    }

    return iterator;
  }

  _getMaxPageIndex() {

    return Math.max(0, Math.floor(this.pageLength / this.pageSize) - 1);
  }

  _coerceNumber(value: any) {

    return coerceNumberProperty(value);
  }

  private setBooleanProperty(
    key: 'hideFirstLastButton'|'hidePrevNextButton'|'hideConsole'|'hideGoTo'|'hideSizeOption'|'hideDisplay',
    value: boolean
  ) {
    value = coerceBooleanProperty(value);

    if (this[key] !== value) return;

    this[`_${ key }` as const] = value;
    this.changeDetector.markForCheck();
  }

}
