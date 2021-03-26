import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { faBars, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthAPI } from 'common/api/auth-api';
import { APIErrorParser } from 'common/api/error-parser';
import { UserAPI } from 'common/api/user-api';
import { FlipBar } from 'common/flip-bar';
import { InventorySwitch } from 'common/inventory';


@Component({
  selector: 'deus-top',
  templateUrl: 'top.component.html',
  styleUrls: [ 'top.component.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'top'
  }
})
export class TopComponent {

  public readonly icons = {
    title: faCog,
    menu: faBars,
    out: faSignOutAlt
  }

  public user = this.authAPI.me!;
  public profileImagePlaceholder = this.userAPI.getProfileImagePlaceholder();

  private processing = false;

  @ViewChild(InventorySwitch) inventorySwitch!: InventorySwitch;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private authAPI: AuthAPI,
    private userAPI: UserAPI,
    private flipBar: FlipBar,
    private errorParser: APIErrorParser
  ) { }

  // no needs to navigate manually since parent component took care of auth states
  public async signOut() {
    if (this.processing) return;

    this.processing = true;

    try {

      await this.authAPI.signOut().toPromise();

    } catch (error) {

      this.errorParser.parse(error).subscribe(error => {

        this.flipBar.open(error.message);

      });

      return;
    } finally {

      this.processing = false;

    }

    this.inventorySwitch.dispose();
    this.flipBar.open(`${ this.user.username }님 안녕히가세요.`);
  }

}
