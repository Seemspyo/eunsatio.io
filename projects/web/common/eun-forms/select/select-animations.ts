import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

// couldn't use `height` animation since overlay's position got miscalculated when height being animated
export const panelAnimation = trigger('panelAnimation', [

  state('closed, opened', style({ overflow: 'hidden' })),
  state('closed', style({ opacity: 0, transform: 'scaleY(0.2)' })),

  transition('closed => opened', [
    animate('0.5s ease', style({ opacity: 1, transform: 'scaleY(1)' }))
  ]),

  transition('opened => closed', [
    animate('0.5s ease', style({ opacity: 0, transform: 'scaleY(0.2)' }))
  ])

]);
