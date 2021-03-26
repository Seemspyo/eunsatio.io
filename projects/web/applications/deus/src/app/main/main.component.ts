import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthAPI } from 'common/api/auth-api';
import { SubscriptionContainer } from 'common/rxjs/subscription-container';


@Component({
  selector: 'deus-main',
  templateUrl: 'main.component.html',
  styleUrls: [ 'main.component.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    SubscriptionContainer
  ],
  host: {
    'class': 'main'
  }
})
export class MainComponent implements OnInit {

  constructor(
    private authAPI: AuthAPI,
    private subscription: SubscriptionContainer,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscription.add(

      // track auth state
      this.authAPI.authState.subscribe(state => {

        if (state === false) {
          this.router.navigateByUrl('/auth/sign-in');
        }

      })

    );
  }

}
