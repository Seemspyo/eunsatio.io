import {
  GQLForbiddenError,
  GQLNotFoundError,
  GQLPermissionError
} from '../../errors';
import { BlogArticle, BlogSeries } from '../../models';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  Query,
  Resolver,
  Root
} from 'type-graphql';
import { getRepository } from 'typeorm';
import { GQLContext } from '../../graphql/@graphql';
import {
  applyPagination,
  createSearchQueryBuilder,
  ListInput,
  PagingInput
} from './@resolver';
import { canWriteBlogArticle, canDeleteBlogArticle } from '../../roles/blog';


@InputType()
export class BlogSeriesCreateInput {

  @Field()
  name!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  locked?: boolean;

}

@InputType()
export class BlogSeriesUpdateInput {

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  locked?: boolean;

}

@Resolver(of => BlogSeries)
export class BlogSeriesResolver {

  private articleRepo = getRepository(BlogArticle);
  private seriesRepo = getRepository(BlogSeries);

  @Authorized('*')
  @Query(returns => [ BlogSeries ])
  getBlogSeriesList(
    @Ctx() { user }: GQLContext,
    @Arg('withLocked', {
      defaultValue: false,
      description: 'whether fetching locked articles together'
    }) withLocked: boolean,
    @Arg('sort', { defaultValue: {} }) sort: ListInput,
    @Arg('pagination', { nullable: true }) pagination?: PagingInput
  ) {
    const query = this.seriesRepo.createQueryBuilder('series');

    if (withLocked) {

      if (!user?.roles?.some(role => canWriteBlogArticle.includes(role as any))) {

        throw new GQLPermissionError();
      }

      query
      .where('series.id IS NOT NULL') // empty where claus for chaining
      .leftJoin('series.articles', 'article');

    } else {

      query
      .where('series.locked = :false', { false: 0 })
      .leftJoin('series.articles', 'article', 'article.locked = :false');

    }

    query.addSelect('article.id');

    if (sort.searchValue && sort.searchTargets.length) {

      createSearchQueryBuilder(sort.searchTargets, sort.searchValue!)
      .expect('article')
      .apply(query, 'series');

    }

    if (sort.orderBy) {

      query.orderBy(sort.orderBy, sort.orderDirection);

    }

    if (pagination) {

      applyPagination(query, pagination);

    }

    return query.getMany();
  }

  @Authorized('*')
  @Query(returns => BlogSeries)
  async getBlogSeriesByName(
    @Ctx() { user }: GQLContext,
    @Arg('name') name: string
  ) {

    const series = await this.seriesRepo
                              .createQueryBuilder('series')
                              .where('series.name = :name', { name })
                              .leftJoin('series.articles', 'article')
                              .addSelect('article.id')
                              .getOneOrFail();

    if (series.locked && !user?.roles?.some(role => canWriteBlogArticle.includes(role as any))) {

      throw new GQLNotFoundError();
    }

    return series;
  }

  @Authorized(canWriteBlogArticle)
  @Mutation(returns => BlogSeries)
  createBlogSeries(
    @Arg('input') input: BlogSeriesCreateInput
  ) {
    const series = Object.assign(new BlogSeries(), input);

    return this.seriesRepo.save(series);
  }

  @Authorized(canWriteBlogArticle)
  @Mutation(returns => BlogSeries)
  async updateBlogSeries(
    @Arg('id') id: string,
    @Arg('input') input: BlogSeriesUpdateInput
  ) {
    const series = await this.seriesRepo
                              .createQueryBuilder('series')
                              .where('series.id = :id', { id })
                              .leftJoin('series.articles', 'article')
                              .addSelect('article.id')
                              .getOneOrFail();

    return await this.seriesRepo.save(Object.assign(series, input));
  }

  @Authorized(canDeleteBlogArticle)
  @Mutation(returns => Boolean)
  async deleteBlogSeries(
    @Arg('id') id: string
  ) {
    const series = await this.seriesRepo
                              .createQueryBuilder('series')
                              .where('series.id = :id', { id })
                              .leftJoin('series.articles', 'article')
                              .addSelect('article.id')
                              .getOneOrFail();

    if (series.articles.length) {

      throw new GQLForbiddenError('cannot delete series containing any articles');
    }

    await this.seriesRepo.remove(series);

    return true;
  }

  @FieldResolver(returns => [ BlogArticle ], { nullable: true })
  articles(@Root() series: BlogSeries) {
    if (!series.articles?.length) {

      return null;
    }

    const ids = series.articles.map(article => article.id);

    return this.articleRepo
    .createQueryBuilder('article')
    .setParameters({ ids, false: 0 })
    .leftJoinAndSelect('article.author', 'author', 'author.deleted = :false')
    .leftJoinAndSelect('article.collaborators', 'collaborator', 'collaborator.deleted = :false')
    .leftJoinAndSelect('article.series', 'series')
    .where('article.id IN (:ids)') // skip series locked check since this field is no more than a FieldResolver.
    .getMany();
  }

}
