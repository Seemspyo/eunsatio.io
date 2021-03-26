import {
  ConnectedPosition,
  Overlay,
  OverlayRef
} from '@angular/cdk/overlay';
import {
  Directive,
  ElementRef,
  Input,
  isDevMode,
  OnDestroy,
  ViewContainerRef
} from '@angular/core';
import { SubscriptionContainer } from 'common/rxjs/subscription-container';
import { Inventory, InventoryCloseType } from './inventory';
import { splitCamelCase } from '@eunsatio.io/util/dist/split-camel';
import { TemplatePortal } from '@angular/cdk/portal';
import { FocusMonitor } from '@angular/cdk/a11y';


@Directive({
  selector: '[inventorySwitchFor]',
  host: {
    'class': 'inventory-switch',
    '(click)': 'open()'
  },
  providers: [
    SubscriptionContainer
  ]
})
export class InventorySwitch implements OnDestroy {

  @Input('inventorySwitchFor')
  get inventory() {

    return this._inventory;
  }
  set inventory(inventory: Inventory) {
    if (this._inventory === inventory) return;

    this._inventory = inventory;
    this.subscription.disposeAll();

    if (!inventory) return;

    this.subscription.add(
      inventory.opened.subscribe(() => this.inventory.focusFirstItem()),
      inventory.closed.subscribe(closeBy => this.detach(closeBy))
    );
  }
  private _inventory!: Inventory;

  private overlayRef: OverlayRef|null = null;
  private portal?: TemplatePortal;

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private viewRef: ViewContainerRef,
    private subscription: SubscriptionContainer,
    private overlay: Overlay,
    private focusMonitor: FocusMonitor
  ) { }

  ngOnDestroy() {
    this.dispose();
  }

  public open() {
    if (this.overlayRef) return;

    if (!this.inventory) {

      if (isDevMode()) {

        console.warn('inventory is `null`');
      }

      return;
    }

    const overlayRef = this.overlay.create({
      positionStrategy: this.getPositionStrategy(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    overlayRef.attach(this.getPortal());
    this.inventory.setState('opened');

    overlayRef.backdropClick().subscribe(() => this.close('click'));
    overlayRef.detachments().subscribe(() => this.close('program'));

    this.overlayRef = overlayRef;
  }

  public close(closeBy?: InventoryCloseType) {
    this.inventory?.setState('closed', closeBy);
  }

  public dispose() {
    this.detach('program');
  }

  private detach(closeBy?: InventoryCloseType) {
    if (!this.overlayRef) return;

    this.overlayRef.dispose();
    this.overlayRef = null;

    if (closeBy !== 'tabout') {

      this.focusMonitor.focusVia(this.elRef.nativeElement, 'program');
    }
  }

  private getPositionStrategy() {
    const
    [ xOrigin, xDirection ] = splitCamelCase(this.inventory?.alignX || 'beforeEnd'),
    [ yOrigin, yDirection ] = splitCamelCase(this.inventory?.alignY || 'afterEnd');

    const
    position: ConnectedPosition = {
      originX: xDirection === 'begin' ? 'start' : 'end',
      originY: yDirection === 'begin' ? 'top' : 'bottom',
      overlayX: xOrigin === 'before' ? 'end' : 'start',
      overlayY: yOrigin === 'before' ? 'bottom' : 'top'
    },
    positionAlt = this.invertPosition(position);

    return this.overlay.position()
    .flexibleConnectedTo(this.elRef.nativeElement)
    .withLockedPosition()
    .withGrowAfterOpen()
    .withPositions([ position, positionAlt ])
    .withTransformOriginOn('.inventory');
  }

  private invertPosition({ originX, originY, overlayX, overlayY }: ConnectedPosition) {

    return {
      originX: originX === 'start' ? 'end' : 'start',
      originY: originY === 'top' ? 'bottom' : 'top',
      overlayX: overlayX === 'start' ? 'end' : 'start',
      overlayY: overlayY === 'top' ? 'bottom' : 'top'
    } as ConnectedPosition;
  }

  private getPortal() {

    return this.portal = this.portal || new TemplatePortal(this.inventory!.templateRef, this.viewRef);
  }

}
