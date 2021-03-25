import { Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  Optional,
  ViewEncapsulation
} from '@angular/core';
import { KOA_CONTEXT } from 'common/api/auth-strategy';
import { Context } from 'koa';


@Component({
  selector: 'page-not-found',
  templateUrl: 'page-not-found.html',
  styleUrls: [ 'page-not-found.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'not-found'
  }
})
export class PageNotFound implements OnInit, AfterViewInit {

  public path!: string;

  constructor(
    private location: Location,
    @Optional() @Inject(KOA_CONTEXT) private ctx?: Context
  ) { }

  ngOnInit() {
    this.path = this.location.path(true);
  }

  ngAfterViewInit() {
    if (this.ctx) {
      this.ctx.status = 404;
    }
  }

}
