import {
  GQLForbiddenError,
  GQLNotFoundError,
  GQLPermissionError
} from '../../errors';
import {
  BlogArticle,
  BlogComment,
  User,
  userRoles
} from '../../models';
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
import { allUsers, applyPagination, PagingInput } from './@resolver';


@InputType()
export class BlogCommentCreateInput {

  @Field()
  articleId!: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  content!: string;

}

@InputType()
export class BlogCommentUpdateInput {

  @Field()
  content!: string;

}

const canDeleteOthers = [
  userRoles.deus,
  userRoles.admin,
  userRoles.blogAdmin
]

@Resolver(of => BlogComment)
export class BlogCommentResolver {

  private commentRepo = getRepository(BlogComment);
  private userRepo = getRepository(User);
  private articleRepo = getRepository(BlogArticle);

  @Authorized('*')
  @Query(returns => [ BlogComment ])
  getBlogCommentList(
    @Arg('articleId') articleId: string,
    @Arg('pagination', { nullable: true }) pagination?: PagingInput
  ) {
    const query = this.commentRepo
                      .createQueryBuilder('comment')
                      .leftJoin('comment.author', 'author')
                      .leftJoin('comment.article', 'article')
                      .leftJoin('comment.parent', 'parent')
                      .addSelect([ 'author.id', 'parent.id' ])
                      .where('article.id = :articleId', { articleId });

    if (pagination) {

      applyPagination(query, pagination);

    }

    return query.getMany();
  }

  @Authorized(allUsers)
  @Query(returns => [ BlogComment ])
  getMyBlogCommentList(
    @Ctx() { user }: GQLContext,
    @Arg('pagination', { nullable: true }) pagination?: PagingInput
  ) {
    const query = this.commentRepo
                      .createQueryBuilder('comment')
                      .leftJoin('comment.author', 'author')
                      .leftJoin('comment.article', 'article')
                      .addSelect([ 'author.id', 'article.id' ])
                      .where('author.id = :authorId', { authorId: user!.id });

    if (pagination) {

      applyPagination(query, pagination);

    }

    return query.getMany();
  }

  @Authorized(canDeleteOthers)
  @Query(returns => [ BlogComment ])
  getBlogCommentListByAuthor(
    @Arg('authorId') authorId: string,
    @Arg('pagination', { nullable: true }) pagination?: PagingInput
  ) {
    const query = this.commentRepo
                      .createQueryBuilder('comment')
                      .leftJoin('comment.author', 'author')
                      .leftJoin('comment.parent', 'parent')
                      .leftJoin('comment.article', 'article')
                      .addSelect([ 'author.id', 'article.id', 'parent.id' ])
                      .where('author.id = :authorId', { authorId });

    if (pagination) {

      applyPagination(query, pagination);

    }

    return query.getMany();
  }

  @Authorized(allUsers)
  @Mutation(returns => BlogComment)
  async createBlogComment(
    @Ctx() { user }: GQLContext,
    @Arg('input') input: BlogCommentCreateInput
  ) {
    const comment = new BlogComment();

    comment.article = await this.articleRepo
                                .createQueryBuilder('article')
                                .setParameters({ false: 0, id: input.articleId })
                                .where('article.id = :id')
                                .andWhere('article.locked = :false')
                                .andWhere('article.isDraft = :false')
                                .getOneOrFail();

    if (input.parentId) {

      const parent = await this.commentRepo
                                .createQueryBuilder('parent')
                                .setParameters({ id: input.parentId, articleId: input.articleId })
                                .leftJoin('parent.article', 'article')
                                .where('parent.id = :id')
                                .andWhere('article.id = :articleId')
                                .getOne();

      if (!parent) {

        throw new GQLNotFoundError(`failed to find parent \`${ input.parentId }\``);
      }

      if (parent.deleted) {

        throw new GQLForbiddenError('cannot comment to deleted comment');
      }

      comment.parent = parent;

    }

    comment.author = user!;
    comment.content = input.content;

    return await this.commentRepo.save(comment);
  }

  @Authorized(allUsers)
  @Mutation(returns => BlogComment)
  async updateBlogComment(
    @Ctx() { user }: GQLContext,
    @Arg('id') id: string,
    @Arg('input') input: BlogCommentUpdateInput
  ) {
    const comment = await this.commentRepo
                              .createQueryBuilder('comment')
                              .setParameters({ false: 0, id })
                              .leftJoin('comment.author', 'author', 'author.deleted = :false')
                              .addSelect('author.id')
                              .where('comment.id = :id')
                              .getOneOrFail();

    // cannot alter comment even if author has resigned.
    if (comment.author?.id !== user!.id) {

      throw new GQLPermissionError();
    }

    if (comment.deleted) {

      throw new GQLForbiddenError('cannot update deleted comment');
    }

    comment.content = input.content;

    return await this.commentRepo.save(comment);
  }

  @Authorized(allUsers)
  @Mutation(returns => Boolean)
  async deleteBlogComment(
    @Ctx() { auth, user }: GQLContext,
    @Arg('id') id: string
  ) {
    const comment = await this.commentRepo
                              .createQueryBuilder('comment')
                              .setParameters({ false: 0, id })
                              .leftJoin('comment.author', 'author', 'author.deleted = :false')
                              .where('comment.id = :id')
                              .getOneOrFail();

    if (comment.author?.id !== user!.id) {

      if (!user!.roles.some(role => canDeleteOthers.includes(role as any))) {

        throw new GQLPermissionError();
      }

    }

    if (comment.deleted) {

      throw new GQLForbiddenError('already deleted');
    }

    comment.deletedContent = auth.SHAEncrypt(comment.content) + Date.now().toString(16);
    comment.content = 'DELETED';
    comment.deleted = true;

    await this.commentRepo.save(comment);

    return comment.deleted;
  }

  @FieldResolver(returns => User, { nullable: true })
  author(@Root() comment: BlogComment) {
    if (!comment.author) {

      return null;
    }

    return this.userRepo
    .createQueryBuilder('user')
    .setParameters({ false: 0, id: comment.author.id })
    .where('user.id = :id')
    .andWhere('user.deleted = :false')
    .getOne();
  }

  @FieldResolver(returns => BlogArticle, { nullable: true })
  article(@Root() comment: BlogComment) {
    if (!comment.article) {

      return null;
    }

    return this.articleRepo
    .createQueryBuilder('article')
    .setParameters({ false: 0, id: comment.article.id })
    .leftJoinAndSelect('article.author', 'author', 'author.deleted = :false')
    .leftJoinAndSelect('article.collaborators', 'collaborator', 'collaborator.deleted = :false')
    .leftJoinAndSelect('article.series', 'series')
    .where('article.id = :id')
    .getOne();
  }

  @FieldResolver(returns => BlogComment, { nullable: true, description: 'parent only resolves fields `author` and `id` for performance' })
  parent(@Root() comment: BlogComment) {
    if (!comment.parent) {

      return null;
    }

    return this.commentRepo
    .createQueryBuilder('comment')
    .setParameters({ false: 0, id: comment.parent.id })
    .select('comment.id')
    .leftJoinAndSelect('comment.author', 'author', 'author.deleted = :false')
    .where('comment.id = :id')
    .getOne();
  }

}
