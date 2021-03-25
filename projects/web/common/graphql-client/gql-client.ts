import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  Optional,
  SkipSelf
} from '@angular/core';
import {
  AngularHttpOptions,
  GQLErrorPipe,
  GQLResponse
} from './@gql-client';
import { DocumentNode, print } from 'graphql';
import { map } from 'rxjs/operators';


export class GQLClientConfig {

  uri: string = '/graphql';
  errorPipe?: GQLErrorPipe;

}

@Injectable()
export class GQLClient {

  private http!: HttpClient;
  private config!: GQLClientConfig;

  constructor(
    http: HttpClient,
    @Optional() @SkipSelf() parentHttp?: HttpClient,
    config?: GQLClientConfig
  ) {
    this.http = parentHttp || http;
    this.config = { ...new GQLClientConfig(), ...config }
  }

  public query<T>(query: DocumentNode, variables?: Record<string, any>, options?: AngularHttpOptions) {

    return this.http.post<GQLResponse<T>>(this.config.uri, {

      query: print(query),
      variables

    }, options).pipe(

      map(res => {

        if (res.errors?.length) {

          throw this.config.errorPipe?.(res.errors) || res.errors;
        }

        return res.data!;
      })

    );
  }

}
