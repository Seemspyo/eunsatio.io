import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Inventory } from './inventory';
import { InventoryItem } from './inventory-item';
import { InventorySwitch } from './inventory-switch';


@NgModule({
  declarations: [
    Inventory,
    InventoryItem,
    InventorySwitch
  ],
  imports: [
    CommonModule,
    OverlayModule,
    A11yModule
  ],
  exports: [
    Inventory,
    InventoryItem,
    InventorySwitch
  ]
})
export class InventoryModule { }
