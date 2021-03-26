import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';


export const inventoryAnimation = trigger('inventoryAnimation', [

  state('closed', style({ opacity: 0, transform: 'scale(0.8)' })),

  transition('closed => opened', [
    animate('0.3s ease', style({ opacity: 1, transform: 'scale(1.0)' }))
  ]),

  transition('opened => closed', [
    animate('0.3s ease', style({ opacity: 0, transform: 'scale(0.8)' }))
  ])

]);
