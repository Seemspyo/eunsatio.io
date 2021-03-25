import { GQLDuplicationError, GQLForbiddenError } from '../../errors';
import { BlogArticle, BlogBookmark } from '../../models';
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root
} from 'type-graphql';
import { getRepository } from 'typeorm';
import { GQLContext } from '../../graphql/@graphql';
import {
  allUsers,
  applyPagination,
  createSearchQueryBuilder,
  ListInput,
  PagingInput
} from './@resolver';


@Resolver(of => BlogBookmark)
export class BlogBookmarkResolver {

  private articleRepo = getRepository(BlogArticle);
  private bookmarkRepo = getRepository(BlogBookmark);

  @Authorized(allUsers)
  @Query(returns => [ BlogBookmark ])
  getBlogBookmarkList(
    @Ctx() { user }: GQLContext,
    @Arg('sort', { defaultValue: {} }) sort: ListInput,
    @Arg('pagination', { nullable: true }) pagination?: PagingInput
  ) {
    const query = this.bookmarkRepo
                      .createQueryBuilder('bookmark')
                      .leftJoin('bookmark.target', 'target')
                      .addSelect('target.id')
                      .where('bookmark.userId = :userId', { userId: user!.id });

    if (sort.searchValue && sort.searchTargets.length) {

      createSearchQueryBuilder(sort.searchTargets, sort.searchValue)
      .expect('target')
      .apply(query, 'bookmark');

    }

    if (sort.orderBy) {

      query.orderBy(sort.orderBy, sort.orderDirection);

    }

    if (pagination) {

      applyPagination(query, pagination);

    }

    return query.getMany();
  }

  @Authorized(allUsers)
  @Mutation(returns => BlogBookmark)
  async createBlogBookmark(
    @Ctx() { user }: GQLContext,
    @Arg('targetId') targetId: string
  ) {
    const dupBookmark = await this.bookmarkRepo
                                  .createQueryBuilder('bookmark')
                                  .leftJoin('bookmark.target', 'target')
                                  .setParameters({ targetId, userId: user!.id })
                                  .where('bookmark.userId = :userId')
                                  .andWhere('target.id = :targetId')
                                  .getOne();

    if (dupBookmark) {

      throw new GQLDuplicationError({ targetId }, 'already bookmarked');
    }

    const target = await this.articleRepo.findOneOrFail(targetId);

    if (target.locked || target.series?.locked || target.isDraft) {

      throw new GQLForbiddenError();
    }

    const bookmark = Object.assign(new BlogBookmark(), {
      target,
      userId: user!.id
    });

    return await this.bookmarkRepo.save(bookmark);
  }

  @Authorized(allUsers)
  @Mutation(returns => Boolean)
  async deleteBlogBookmark(
    @Ctx() { user }: GQLContext,
    @Arg('targetId') targetId: string
  ) {
    const bookmark = await this.bookmarkRepo
                                .createQueryBuilder('bookmark')
                                .leftJoin('bookmark.target', 'target')
                                .setParameters({ targetId, userId: user!.id })
                                .where('bookmark.userId = :userId')
                                .andWhere('target.id = :targetId')
                                .getOneOrFail();

    await this.bookmarkRepo.remove(bookmark);

    return true;
  }

  @FieldResolver(returns => BlogArticle, { nullable: true })
  target(@Root() bookmark: BlogBookmark) {
    if (!bookmark.target?.id) {

      return null;
    }

    return this.articleRepo
    .createQueryBuilder('target')
    .setParameters({ false: 0, id: bookmark.target.id })
    .leftJoinAndSelect('target.author', 'author', 'author.deleted = :false')
    .leftJoinAndSelect('target.collaborators', 'collaborator', 'collaborator.deleted = :false')
    .leftJoinAndSelect('target.series', 'series')
    .where('target.id = :id')
    .getOne();
  }

}
