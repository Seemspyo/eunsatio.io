import { UserInputError } from 'apollo-server-errors';
import { GQLPermissionError } from '../../errors';
import {
  BlogArticle,
  BlogSeries,
  User
} from '../../models';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root
} from 'type-graphql';
import { Brackets, getRepository } from 'typeorm';
import { GQLContext } from '../../graphql/@graphql';
import {
  applyPagination,
  createSearchQueryBuilder,
  ListInput,
  PagingInput
} from './@resolver';
import { canWriteBlogArticle, canDeleteBlogArticle } from '../../roles/blog';


@InputType()
export class BlogArticleListInput extends ListInput {

  @Field({ nullable: true })
  seriesName?: string;

  @Field({ nullable: true })
  authorId?: string;

  @Field({ defaultValue: true })
  considerCollaborator!: boolean;

  @Field(type => [ String ], { defaultValue: [] })
  tags!: string[];

  @Field({ defaultValue: false })
  withDraft!: boolean;

  @Field({ defaultValue: false, description: 'if `withDraft` is `true`, this field will ignored.' })
  onlyDraft!: boolean;

  @Field({ defaultValue: false })
  withLocked!: boolean;

}

@InputType()
export class BlogArticleCreateInput {

  @Field({ nullable: true, description: 'a draft\'s `id` to override. ignored if `isDraft` is `true` or draft with given id does not exists.' })
  from?: string;

  @Field({ nullable: true, description: 'path chunk without protocol & host. required if `isDraft` is `false`' })
  uri?: string;

  @Field({ nullable: true, description: 'required if `isDraft` is false' })
  title?: string;

  @Field()
  content!: string;

  @Field({ nullable: true, description: 'series `id`. ignored if series with given `id` does not exists.' })
  seriesId?: string;

  @Field({ nullable: true })
  thumbnailUrl?: string;

  @Field(type => [ String ], { nullable: true })
  tags?: string[];

  @Field({ defaultValue: false })
  isDraft!: boolean;

}

@InputType()
export class BlogArticleUpdateInput {

  @Field({ nullable: true, description: 'path chunk without protocol & host.' })
  uri?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true, description: 'series `id`. ignored if series with given `id` does not exists.' })
  seriesId?: string;

  @Field({ nullable: true })
  thumbnailUrl?: string;

  @Field(type => [ String ], { nullable: true })
  tags?: string[];

}

@Resolver(of => BlogArticle)
export class BlogArticleResolver {

  private articleRepo = getRepository(BlogArticle);
  private userRepo = getRepository(User);
  private seriesRepo = getRepository(BlogSeries);

  @Authorized('*')
  @Query(returns => [ BlogArticle ])
  getBlogArticleList(
    @Ctx() { user }: GQLContext,
    @Arg('search', { defaultValue: {} }) search: BlogArticleListInput,
    @Arg('pagination', { nullable: true }) pagination?: PagingInput
  ) {
    const query = this.createListSelectQuery(user, search);

    if (pagination) {

      applyPagination(query, pagination);

    }

    return query.getMany();
  }

  @Authorized('*')
  @Query(returns => Int)
  countBlogArticles(
    @Ctx() { user }: GQLContext,
    @Arg('search', { defaultValue: {} }) search: BlogArticleListInput
  ) {

    return this.createListSelectQuery(user, search).getCount();
  }

  @Authorized('*')
  @Query(returns => BlogArticle)
  async getBlogArticleByURI(
    @Ctx() { user }: GQLContext,
    @Arg('uri') uri: string
  ) {
    const article = await this.createBasicSelectQuery()
                              .where('article.uri = :uri', { uri })
                              .addSelect([ 'article.content', 'series.locked' ])
                              .getOneOrFail();

    if (article.isDraft || article.locked || article.series?.locked) {

      if (!user?.roles?.some(role => canWriteBlogArticle.includes(role as any))) {
        
        throw new GQLPermissionError();
      }

    }

    return article;
  }

  @Authorized(canWriteBlogArticle)
  @Query(returns => BlogArticle)
  async getBlogArticleById(
    @Arg('id') id: string
  ) {
    const query = this.createBasicSelectQuery()
                      .where('article.id = :id', { id })
                      .addSelect('article.content');

    return query.getOneOrFail();
  }

  @Authorized(canWriteBlogArticle)
  @Mutation(returns => BlogArticle)
  async createBlogArticle(
    @Ctx() { user }: GQLContext,
    @Arg('input') input: BlogArticleCreateInput
  ) {
    let article: BlogArticle;
    const freshOne = article = new BlogArticle();

    // from draft
    if (input.from) {

      if (input.isDraft) {

        throw new UserInputError('cannot create draft out of draft', { target: 'input.from', value: input.from });
      }

      const draft = await this.createBasicSelectQuery()
                              .setParameter('id', input.from)
                              .where('article.isDraft = :true')
                              .andWhere('article.id = :id')
                              .getOne();

      if (draft) {

        article = draft;

      }
    }

    // draft not assigned
    if (article === freshOne) {

      article.author = user!;

    } else {

      // assign as collaborator
      if (article.author?.id !== user!.id && !article.collaborators?.some(collaborator => collaborator.id === user!.id)) {

        article.collaborators = (article.collaborators || []).concat([ user! ]);
      }

    }

    if (input.seriesId) {

      const series = await this.seriesRepo.findOne(input.seriesId);

      if (series) {

        article.series = series;

      }

    }

    if (input.isDraft) {

      Object.assign(article, {
        title: 'DRAFT',
        uri: `draft://${ Date.now().toString(16) }`
      });

    } else {

      // check required fields
      for (const key of [ 'title', 'uri' ] as const) {

        if (!input[key]) {

          throw new UserInputError(`${ key } must be provided`, { target: `input.${ key }`, value: input[key] });
        }

      }

    }

    return await this.articleRepo.save(Object.assign(article, input));
  }

  @Authorized(canWriteBlogArticle)
  @Mutation(returns => BlogArticle)
  async updateBlogArticle(
    @Ctx() { user }: GQLContext,
    @Arg('id') id: string,
    @Arg('input') input: BlogArticleUpdateInput
  ) {
    const article = await this.createBasicSelectQuery()
                              .where('article.id = :id', { id })
                              .getOneOrFail();

    if (
      article.author?.id !== user!.id
      && !article.collaborators?.some(collaborator => collaborator.id === user!.id)
    ) {

      article.collaborators = (article.collaborators || []).concat(user!);

    }

    if (input.seriesId) {

      const series = await this.seriesRepo.findOne(input.seriesId);

      if (series) {

        article.series = series;

      }

    }

    return await this.articleRepo.save(Object.assign(article, input));
  }

  @Authorized(canDeleteBlogArticle)
  @Mutation(returns => Boolean)
  async deleteBlogArticle(
    @Arg('id') id: string
  ) {
    const article = await this.articleRepo.findOneOrFail(id);

    await this.articleRepo.remove(article);

    return true;
  }

  private createBasicSelectQuery() {

    return this.articleRepo
    .createQueryBuilder('article')
    .setParameters({ true: 1, false: 0 })
    .leftJoin('article.author', 'author')
    .leftJoin('article.collaborators', 'collaborator')
    .leftJoin('article.series', 'series')
    .addSelect([ 'author.id', 'collaborator.id', 'series.id' ]);
  }

  private createListSelectQuery(user: User|null|undefined, search: BlogArticleListInput) {
    const query = this.createBasicSelectQuery()
                      .where('article.id IS NOT NULL'); // initialize where clause

    if (search.withDraft || search.onlyDraft || search.withLocked) {

      if (!user?.roles?.some(role => canWriteBlogArticle.includes(role as any))) {

        throw new GQLPermissionError();
      }

    }

    if (!search.withDraft && !search.onlyDraft) {

      query.andWhere('article.isDraft = :false')

    } else if (search.onlyDraft) {

      query.andWhere('article.isDraft = :true')

    }

    if (!search.withLocked) {

      query.andWhere(`
        (CASE
          WHEN article.series IS NOT NULL THEN series.locked = :false
          ELSE article.series IS NULL
        END)`
      );

    }

    if (search.authorId) {

      query
      .setParameter('authorId', search.authorId)
      .andWhere(new Brackets(subQuery => {

        subQuery.where('author.id = :authorId');

        if (search.considerCollaborator) {

          subQuery.orWhere('collaborator.id = :authorId');

        }

      }));

    }

    if (search.seriesName) {

      query.andWhere('series.name = :seriesName', { seriesName: search.seriesName });

    }

    if (search.tags.length) {

      query.andWhere('article.tags REGEXP :tag', { tag: `(${ search.tags.join('|').toLowerCase() })` });

    }

    if (search.searchValue && search.searchTargets.length) {

      createSearchQueryBuilder(search.searchTargets, search.searchValue)
      .expect('author', 'collaborator', 'series')
      .apply(query, 'article');

    }

    return query;
  }

  @FieldResolver(returns => User, { nullable: true })
  author(@Root() article: BlogArticle) {
    if (!article.author) {

      return null;
    }

    return this.userRepo
    .createQueryBuilder('user')
    .setParameters({ id: article.author.id, false: 0 })
    .where('user.id = :id')
    .andWhere('user.deleted = :false')
    .getOne();
  }

  @FieldResolver(returns => [ User ], { nullable: true })
  collaborators(@Root() article: BlogArticle) {
    if (!article.collaborators?.length) {

      return null;
    }

    return this.userRepo
    .createQueryBuilder('user')
    .setParameters({ ids: article.collaborators.map(user => user.id), false: 0 })
    .where('user.id IN (:ids)')
    .andWhere('user.deleted = :false')
    .getMany();
  }

  @FieldResolver(returns => BlogSeries, { nullable: true })
  series(@Root() article: BlogArticle) {
    if (!article.series) {

      return null;
    }

    return  this.seriesRepo
    .createQueryBuilder('series')
    .leftJoinAndSelect('series.articles', 'article')
    .where('series.id = :id',  { id: article.series.id })
    .getOne();
  }

}
