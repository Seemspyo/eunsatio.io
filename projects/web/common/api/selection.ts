import gql from 'graphql-tag';


export type GQLFragment<T> = ReadonlyArray<keyof T>;

export function toFragment<T>(name: string, typeName: string, select: GQLFragment<T>) {

  return gql`
    fragment ${ name } on ${ typeName } {
      ${ select.join('\n') }
    }
  `;
}
