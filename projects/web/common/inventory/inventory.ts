import { AnimationEvent } from '@angular/animations';
import { FocusKeyManager, FocusMonitor } from '@angular/cdk/a11y';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { hasModifierKey } from '@eunsatio.io/util/dist/has-modifier-key';
import { inventoryAnimation } from './inventory-animation';
import { InventoryItem } from './inventory-item';


export type InventoryAlign = 'beforeBegin'|'afterBegin'|'beforeEnd'|'afterEnd';
export type InventoryCloseType = 'tabout'|'escape'|'click'|'program';

@Component({
  selector: 'inventory',
  template: `
    <ng-template>
      <div
        #inventory
        class="inventory"
        [@inventoryAnimation]="state"
        (@inventoryAnimation.done)="_onAnimationDone($event)"
        (keydown)="_onKeydown($event)"
        (click)="setState('closed')"
        tabindex="-1"
        role="menu"
      >
        <ng-content></ng-content>
      </div>
    </ng-template>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'inventory-container'
  },
  animations: [ inventoryAnimation ]
})
export class Inventory implements AfterContentInit, OnDestroy {

  @ViewChild(TemplateRef)
  templateRef!: TemplateRef<any>;

  @ViewChild('inventory') inventoryElRef!: ElementRef<HTMLElement>;

  @ContentChildren(InventoryItem, { descendants: true })
  items!: QueryList<InventoryItem>;

  @Input()
  alignX?: InventoryAlign;

  @Input()
  alignY?: InventoryAlign;

  @Output()
  opened = new EventEmitter<void>();

  @Output()
  closed = new EventEmitter<InventoryCloseType>();

  private keyManager!: FocusKeyManager<InventoryItem>;
  private closeBy?: InventoryCloseType;
  
  public state: 'opened'|'closed' = 'closed';

  constructor(
    private changeDetector: ChangeDetectorRef,
    private focusMonitor: FocusMonitor
  ) { }

  ngAfterContentInit() {
    this.keyManager =  new FocusKeyManager(this.items)
                      .withWrap()
                      .withTypeAhead()
                      .withHomeAndEnd()
                      .withAllowedModifierKeys(['altKey','ctrlKey','shiftKey','metaKey']);

    this.keyManager.tabOut.subscribe(() => this.setState('closed', 'tabout'));
  }

  ngOnDestroy() {
    this.closed.complete();
  }

  public setState(state: 'opened'|'closed', closeBy?: InventoryCloseType) {
    this.state = state;
    this.closeBy = closeBy;
    this.changeDetector.markForCheck();
  }

  public focusFirstItem() {
    this.keyManager.setFocusOrigin('program')
                    .setFirstItemActive();

    if (!this.keyManager.activeItem) {

      this.focusMonitor.focusVia(this.inventoryElRef.nativeElement, 'program');

    }
  }

  _onAnimationDone(event: AnimationEvent) {
    if (event.fromState === 'opened' && event.toState === 'closed') {

      this.closed.emit(this.closeBy);
      this.closeBy = void 0;

    } else if (event.fromState === 'closed' && event.toState === 'opened') {

      this.opened.emit();

    }
  }

  _onKeydown(event: KeyboardEvent) {
    if (hasModifierKey(event)) return;

    const key = event.key.toLowerCase();

    switch (key) {

      case 'escape': {
        event.preventDefault();
        this.setState('closed', 'escape');
        break;
      }

      default: {
        if ([ 'arrowup', 'arrowdown' ].includes(event.key)) {

          this.keyManager.setFocusOrigin('keyboard');

        }

        this.keyManager.onKeydown(event);
      }

    }
  }

}
