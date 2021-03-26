import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SignInInput, User } from '@eunsatio.io/server';
import { AuthAPI } from 'common/api/auth-api';
import { UserAPI } from 'common/api/user-api';
import { APIErrorParser, ErrorPreset } from 'common/api/error-parser';
import { FlipBar } from 'common/flip-bar';
import { PATTERNS_EMAIL } from 'common/patterns/email';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { asyncScheduler } from 'rxjs';
import { trigger } from '@angular/animations';
import { fadeEnter, fadeLeave } from 'common/animations/fade';


export type SignInFormState = 'beforeInput'|'inputEmail'|'inputPassword';

@Component({
  selector: 'deus-sign',
  templateUrl: 'sign.component.html',
  styleUrls: [ 'sign.component.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'sign'
  },
  animations: [
    trigger('fade', [ fadeEnter, fadeLeave ])
  ]
})
export class SignComponent {

  public processing = false;

  public form = this.formBuilder.group({
    emailOrName: [ '', [ Validators.required ] ],
    password: [ '', [ Validators.required, Validators.minLength(4) ] ]
  });

  public formState: SignInFormState = 'beforeInput';

  public userPublic: Pick<User,'email'|'profileImageUrl'>|null = null;

  public errorPreset: ErrorPreset = {
    NOT_FOUND: '계정 정보를 찾을 수 없습니다.',
    FORBIDDEN: '접근 금지된 계정입니다.',
    INVALID_PASSWORD: '비밀번호가 일치하지 않습니다.'
  }

  @ViewChild('EmailInput') emailInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('PasswordInput') passwordInputRef?: ElementRef<HTMLInputElement>;

  public readonly icons = {
    back: faAngleLeft
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private authAPI: AuthAPI,
    private userAPI: UserAPI,
    private flipBar: FlipBar,
    private errorParser: APIErrorParser,
    private router: Router
  ) { }

  public onFormSubmit() {
    switch (this.formState) {

      case 'inputEmail': {

        this.fetchUserPublic();

        break;
      }

      case 'inputPassword': {

        this.signIn();

        break;
      }

    }
  }

  public canSign() {

    return !this.processing && this.form.valid;
  }

  public canCheck() {

    return !this.processing && this.form.get('emailOrName')!.valid;
  }

  public setFormState(state: SignInFormState) {
    this.formState = state;

    switch (state) {

      case 'inputEmail': {
        asyncScheduler.schedule(() => {

          this.emailInputRef!.nativeElement.focus();

        });
        break;
      }

      case 'inputPassword': {
        asyncScheduler.schedule(() => {

          this.passwordInputRef!.nativeElement.focus();

        });
        break;
      }

    }

    this.changeDetector.markForCheck();
  }

  public onPrimaryButtonClick() {
    switch (this.formState) {

      case 'beforeInput': {

        this.setFormState('inputEmail');

        break;
      }

      case 'inputEmail': { 

        this.userPublic = null;
        this.setFormState('beforeInput');

        break;
      }

      case 'inputPassword': {

        this.setFormState('inputEmail');

        break;
      }

    }
  }

  private async fetchUserPublic() {
    if (!this.canCheck()) return;

    this.markProcessing();

    const emailOrName = this.form.get('emailOrName')!.value;

    try {

      this.userPublic = await this.userAPI.getUserPublic(emailOrName, [ 'email', 'profileImageUrl' ]).toPromise();

    } catch (error) {

      this.parseError(error);

      return;
    } finally {

      this.markProcessing(false);

    }

    this.setFormState('inputPassword');
  }

  private async signIn() {
    if (!this.canSign()) return;

    this.markProcessing();

    const { emailOrName, password } = this.form.value;

    const input: SignInInput = { password }

    input[PATTERNS_EMAIL.test(emailOrName) ? 'email' : 'username'] = emailOrName;

    try {

      await this.authAPI.signIn(input).toPromise();

    } catch (error) {
      
      this.parseError(error);

      return;
    } finally {

      this.markProcessing(false);

    }

    this.flipBar.open(`${ this.authAPI.me!.username }님 환영합니다.`);
    this.router.navigateByUrl('/');
  }

  private markProcessing(state = true) {
    this.processing = state;
    this.changeDetector.markForCheck();
  }

  private parseError(error: any) {
    this.errorParser.parse(error, this.errorPreset).subscribe(error => {

      this.flipBar.open(error.message);

    });
  }

}
