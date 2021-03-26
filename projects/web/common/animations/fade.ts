import { animate, style, transition } from '@angular/animations';


export const fadeEnter = transition(':enter', [

  style({ opacity: 0 }),
  animate('{{ transition.fadeEnter }}', style({ opacity: 1 }))

], { params: { 'transition.fadeEnter': '0.3s' } });

export const fadeLeave = transition(':leave', [

  style({ opacity: 1 }),
  animate('{{ transition.fadeLeave }}', style({ opacity: 0 }))

], { params: { 'transition.fadeLeave': '0.3s' } });
