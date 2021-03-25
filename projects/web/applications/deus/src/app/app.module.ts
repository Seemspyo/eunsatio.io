import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { GQLClientModule } from 'common/graphql-client';
import { AuthStrategyModule } from 'common/api/auth-strategy';
import { HttpTransferModule } from 'common/http-transfer';
import { AuthAPI } from 'common/api/auth-api';
import { UserAPI } from 'common/api/user-api';
import { FlipBarModule } from 'common/flip-bar';
import { APIErrorParser } from 'common/api/error-parser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/env';
import { PageNotFound } from './page-not-found/page-not-found';


@NgModule({
  declarations: [
    AppComponent,
    PageNotFound
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'deus' }),
    BrowserTransferStateModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    HttpTransferModule,
    GQLClientModule.withConfig({ uri: environment.apiOrigin + environment.graphqlPath }),
    AuthStrategyModule.withConfig({
      origin: environment.apiOrigin,
      path: environment.graphqlPath,
      domain: environment.domain
    }),
    FlipBarModule,
    FontAwesomeModule
  ],
  bootstrap: [ AppComponent ],
  providers: [
    AuthAPI,
    UserAPI,
    APIErrorParser
  ]
})
export class AppModule { }
