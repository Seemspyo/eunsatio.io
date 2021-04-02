import {
  GQLDuplicationError,
  GQLForbiddenError,
  GQLInvalidError,
  GQLPermissionError
} from '../../errors';
import {
  User,
  userProviders
} from '../../models';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver
} from 'type-graphql';
import { Brackets, getRepository } from 'typeorm';
import { GQLContext } from '../../graphql/@graphql';
import {
  applyPagination,
  createSearchQueryBuilder,
  ListInput,
  PagingInput
} from './@resolver';
import {
  userRoles,
  UserRole,
  allUsers,
  canManageUsers
} from '../../roles/common';


@InputType()
export class UserCreateInput {

  @Field()
  email!: string;

  @Field()
  username!: string;

  @Field()
  password!: string;

  @Field({ nullable: true })
  profileImageUrl?: string;

}

@InputType()
export class UserUpdateInput {

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  password?: string;

  @Field(type => [ userRoles ], { nullable: true })
  roles?: UserRole[];

  @Field({ nullable: true })
  profileImageUrl?: string;

}

@Resolver(of => User)
export class UserResolver {

  private userRepo = getRepository(User);

  @Authorized('*')
  @Query(returns => User, { nullable: true })
  me(
    @Ctx() { user }: GQLContext
  ) {
    if (user?.id) {

      return this.userRepo
      .createQueryBuilder('user')
      .setParameters({ id: user!.id, false: 0 })
      .where('user.id = :id')
      .andWhere('user.blocked = :false')
      .andWhere('user.deleted = :false')
      .getOne();
    }

    return null;
  }

  @Authorized('*')
  @Query(returns => User)
  getUserPublic(
    @Arg('email', { nullable: true }) email?: string,
    @Arg('username', { nullable: true }) username?: string
  ) {
    if (!(email || username)) {

      throw new GQLInvalidError('either email or username must provided.');
    }

    const query = this.userRepo.createQueryBuilder('user')
                                .setParameter('false', 0)
                                .where('user.deleted = :false');

    if (email) {

      query.andWhere('user.email = :email', { email });

    }

    if (username) {

      query.andWhere('user.username = :username', { username });

    }

    return query.getOneOrFail();
  }

  @Authorized(canManageUsers)
  @Query(returns => [ User ])
  getUserList(
    @Arg('sort', { defaultValue: {} }) sort: ListInput,
    @Arg('pagination', { nullable: true }) pagination?: PagingInput
  ) {
    const query = this.userRepo
                  .createQueryBuilder('user')
                  .setParameters({ false: 0 })
                  .where('user.deleted = :false');

    if (sort.searchValue && sort.searchTargets.length) {

      createSearchQueryBuilder(sort.searchTargets, sort.searchValue)
      .apply(query, 'user');

    }

    if (sort.orderBy) {

      query.orderBy(`user.${ sort.orderBy }`, sort.orderDirection);

    }

    if (pagination) {

      applyPagination(query, pagination);

    }

    return query.getMany();
  }

  @Authorized(canManageUsers)
  @Query(returns => User, {
    description: 'get user by `id`. to get an information of the signed user, use `query { me }` instead.'
  })
  getUserById(
    @Arg('id') id: string
  ) {

    return this.userRepo
    .createQueryBuilder('user')
    .setParameters({ id, false: 0 })
    .where('user.deleted = :false')
    .andWhere('user.id = :id')
    .getOneOrFail();
  }

  @Authorized(canManageUsers)
  @Mutation(returns => User)
  async createUser(
    @Ctx() { auth }: GQLContext,
    @Arg('input') { email, username, password, profileImageUrl }: UserCreateInput
  ) {
    const dupUser = await this.userRepo
                              .createQueryBuilder('user')
                              .setParameters({ email, username, provider: userProviders.email })
                              .where('user.provider = :provider')
                              .andWhere(new Brackets(subQuery => {

                                subQuery
                                .where('user.email = :email')
                                .orWhere('user.username = :username');

                              }))
                              .getOne();

    if (dupUser) {
      const props: Record<string, string> = { }

      if (dupUser.email === email) {

        props.email = email;

      }

      if (dupUser.username === username) {

        props.username = username;

      }

      throw new GQLDuplicationError(props);
    }

    const user = Object.assign(new User(), {
      email,
      username,
      password: auth.SHAEncrypt(password),
      profileImageUrl,
      provider: userProviders.email,
      roles: [ userRoles.common ]
    });

    return await this.userRepo.save(user);
  }

  @Authorized(allUsers)
  @Mutation(returns => User)
  async updateUser(
    @Ctx() { auth, user }: GQLContext,
    @Arg('id') id: string,
    @Arg('input') input: UserUpdateInput
  ) {
    const updatee = await this.userRepo
                              .createQueryBuilder('user')
                              .addSelect('user.password')
                              .setParameters({ id, false: 0 })
                              .where('user.deleted = :false')
                              .andWhere('user.id = :id')
                              .getOneOrFail();

    const
    isDeus = user!.roles.includes(userRoles.deus),
    isAdmin = user!.roles.some(role => canManageUsers.includes(role as any));

    if (user!.id !== id) {

      if (!isAdmin) {

        throw new GQLPermissionError();
      }

      // only god can update other admins
      if (updatee.roles.some(role => canManageUsers.includes(role as any)) && !isDeus) {

        throw new GQLPermissionError();
      }

    }

    if (input.roles) {

      if (!isAdmin) {

        throw new GQLPermissionError();
      }

      if (input.roles.some(role => canManageUsers.includes(role as any)) && !isDeus) {

        throw new GQLPermissionError();
      }

    }

    if (input.password) {

      if (updatee.provider !== userProviders.email) {

        throw new GQLInvalidError('only email user can have password');
      }

      input.password = auth.SHAEncrypt(input.password!);

    }

    return await this.userRepo.save(Object.assign(updatee, input));
  }

  @Authorized(canManageUsers)
  @Mutation(returns => Boolean, { description: 'returns current state' })
  async blockUser(
    @Ctx() { user }: GQLContext,
    @Arg('id') id: string
  ) {
    const target = await this.userRepo
                              .createQueryBuilder('user')
                              .setParameters({ id, false: 0 })
                              .where('user.deleted = :false')
                              .andWhere('user.id = :id')
                              .getOneOrFail();

    // gods are invincible
    if (target.roles.includes(userRoles.deus)) {

      throw new GQLForbiddenError();
    }

    const isDeus = user!.roles.includes(userRoles.deus);

    // only god can ban other admins
    if (target.roles.includes(userRoles.admin) && !isDeus) {

      throw new GQLPermissionError();
    }

    if (target.blocked) {

      throw new GQLInvalidError('already blocked.');
    }

    if (user!.id === id) {

      throw new GQLForbiddenError('do not hurt yourself.');
    }

    target.blocked = true;

    await this.userRepo.save(target);

    return target.blocked;
  }

  @Authorized(canManageUsers)
  @Mutation(returns => Boolean, { description: 'returns current state' })
  async unblockUser(
    @Ctx() { user }: GQLContext,
    @Arg('id') id: string
  ) {
    const target = await this.userRepo
                              .createQueryBuilder('user')
                              .setParameters({ id, false: 0 })
                              .where('user.deleted = :false')
                              .andWhere('user.id = :id')
                              .getOneOrFail();

    if (!target.blocked) {

      throw new GQLInvalidError('not blocked.');
    }

    if (user!.id === id) {

      throw new GQLPermissionError('cannot unblock yourself.');
    }

    if (target.roles.includes(userRoles.admin) && !user!.roles.includes(userRoles.deus)) {

      throw new GQLPermissionError('administrators can only be unblocked by deus');
    }

    target.blocked = false;

    await this.userRepo.save(target);

    return target.blocked;
  }

  @Authorized(allUsers)
  @Mutation(returns => Boolean)
  async deleteUser(
    @Ctx() { auth, user }: GQLContext,
    @Arg('id') id: string
  ) {
    const target = await this.userRepo
                              .createQueryBuilder('user')
                              .setParameters({ id, false: 0 })
                              .where('user.deleted = :false')
                              .andWhere('user.id = :id')
                              .getOneOrFail();

    if (target.id !== id) {

      // gods are invincible
      if (target.roles.includes(userRoles.deus)) {
  
        throw new GQLForbiddenError();
      }

      const isDeus = user!.roles.includes(userRoles.deus);

      if (!(isDeus || !user!.roles.includes(userRoles.admin))) {

        throw new GQLPermissionError();
      }

      // only gods can kick other admin's buttcheek
      if (target.roles.includes(userRoles.admin) && !isDeus) {

        throw new GQLPermissionError();
      }

    }

    const
    sign = Date.now().toString(16),
    [ username, domain ] = target.email.split('@');

    await this.userRepo.save(Object.assign(target, {
      email: `${ auth.SHAEncrypt(username) }.${ sign }@${ domain }`,
      uid: target.uid ? `${ auth.SHAEncrypt(target.uid) }.${ sign }` : null,
      username: `${ auth.SHAEncrypt(target.username) }.${ sign }`,
      deleted: true
    }));

    return target.deleted;
  }

}
