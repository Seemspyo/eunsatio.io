import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';


export const dialogContainerAnimation = trigger('dialogContainer', [

  state('void, leave', style({ opacity: 0 })),
  state('enter', style({ opacity: 1 })),

  transition('* => enter', [
    animate('{{ inTransition }}')
  ], { params: { inTransition: '0.5s ease' } }),
  transition('* => void, * => leave', [
    animate('{{ outTransition }}')
  ], { params: { outTransition: '0.3s ease' } })

]);
