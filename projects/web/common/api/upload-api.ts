import { Injectable } from '@angular/core';
import type { UploadLog } from '@eunsatio.io/server';
import { GQLClient } from 'common/graphql-client';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { GQLFragment, toFragment } from './selection';


export const UPLOAD_LOG_FIELDS = [
  'id',
  'userId',
  'from',
  'provider',
  'origin',
  'path',
  'href',
  'uploadAt'
] as const;

@Injectable()
export class UploadAPI {

  constructor(
    private graphql: GQLClient
  ) { }

  public uploadImage(file: File|File[], select: GQLFragment<UploadLog> = UPLOAD_LOG_FIELDS) {
    const isSingle = !Array.isArray(file);

    if (!Array.isArray(file)) {
      file = [ file ]
    }

    if (!file.length) {

      throw new Error('at least one image must provided.');
    }

    const { queryFields, variableFields, variables } = file.reduce((result, image, i) => {

      result.queryFields.push(`uploadImage(image: $image${ i }) { ...UploadFields }`);
      result.variableFields.push(`$image${ i }: Upload!`);
      result.variables[`image${ i }`] = image;

      return result;
    }, {
      queryFields: [] as string[],
      variableFields: [] as string[],
      variables: {} as Record<string, File>
    });

    const query = gql`
      mutation (${ variableFields.join(',') }) {
        ${ queryFields.join('\n') }
      }
      ${ toFragment('UploadFields', 'UploadLog', select) }
    `;

    return this.graphql.upload<{ [key: string]: UploadLog; }>(query, variables).pipe(
      map(res => {
        const logs = Object.values(res);

        return isSingle ? logs[0] : logs;
      })
    );
  }

}
