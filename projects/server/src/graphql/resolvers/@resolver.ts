import { userRoles } from '../../models';
import { Field, InputType, Int } from 'type-graphql';
import { Brackets, SelectQueryBuilder } from 'typeorm';


@InputType()
export class ListInput {

  @Field({ nullable: true, description: 'target property name to order by.' })
  orderBy?: string;

  @Field({ nullable: true, defaultValue: 'ASC' })
  orderDirection!: 'ASC'|'DESC';

  @Field(type => [ String ], { nullable: true, description: 'target properties to search. to target nested properties, use `,`. ex: author.username', defaultValue: [] })
  searchTargets!: string[];

  @Field({ nullable: true })
  searchValue?: string;

}

@InputType()
export class PagingInput {

  @Field(type => Int, { nullable: true, description: 'size of items to skip.' })
  skip?: number;

  @Field(type => Int, { nullable: true, description: 'size of items to take.' })
  take?: number;

}

export function applyPagination<T = any>(query: SelectQueryBuilder<T>, { skip, take }: PagingInput) {
  if (typeof skip === 'number') query.skip(skip);
  if (typeof take === 'number') query.take(take);

  return query;
}

export const allUsers = Object.values(userRoles);

export class SearchQueryBuilder {

  private matchingKeySet = new Set<string>();

  constructor(
    private targets: string[],
    private value: string
  ) { }

  expect(...keys: string[]) {
    for (const key of keys) {

      this.matchingKeySet.add(key);

    }

    return this;
  }

  apply(query: SelectQueryBuilder<any>, alias?: string) {
    if (!this.targets.length) return this;

    const header = alias ? `${ alias }.` : '';

    const getSearchQuery = (targetExp: string) => {
      const [ columnOrKey, key ] = targetExp.split('.');

      const target = this.matchingKeySet.has(columnOrKey) ? `${ columnOrKey }.${ key }` : (header + columnOrKey);

      return `${ target } LIKE :value`;
    }

    query
    .setParameter('value', `%${ this.value }%`)
    .andWhere(new Brackets(subQuery => {

      subQuery.where(getSearchQuery(this.targets[0]));

      for (const target of this.targets.slice(1)) {

        subQuery.orWhere(getSearchQuery(target));

      }

    }));

    return this;
  }

}

export function createSearchQueryBuilder(targets: string[], value: string) {

  return new SearchQueryBuilder(targets, value);
}
