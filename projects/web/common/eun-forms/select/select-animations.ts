import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';


export const panelAnimation = trigger('panelAnimation', [

  state('closed, opened', style({ overflow: 'hidden' })),
  state('closed', style({ opacity: 0, height: '0px' })),

  transition('closed => opened', [
    animate('0.5s ease', style({ opacity: 1, height: '*' }))
  ]),

  transition('opened => closed', [
    animate('0.5s ease', style({ opacity: 0, height: '0px' }))
  ])

]);
