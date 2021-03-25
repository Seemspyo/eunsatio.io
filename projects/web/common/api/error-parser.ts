import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GQLErrorCode } from '@eunsatio.io/server';
import { GQLError } from 'common/graphql-client';
import { from } from 'rxjs';


export interface APIError {

  code: string|number;
  message: string;

}

export type ErrorPreset = Partial<Record<GQLErrorCode|number, string>>;

@Injectable()
export class APIErrorParser {

  public parse(error: any, preset: ErrorPreset = {}) {
    let errors: APIError[];

    if (Array.isArray(error)) {

      errors = error.map((error: GQLError) => {

        const { extensions: { code }, message } = error;

        return { code, message: preset[code] || message }
      });
    } else if (error instanceof HttpErrorResponse) {

      const { status: code, message } = error;

      errors = [ { code, message: preset[code] || message } ]
    } else {

      const code = 0;

      errors = [ { code, message: preset[code] || 'unassigned error' } ]
    }

    return from(errors);
  }

}
