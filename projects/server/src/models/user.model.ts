import { socialProviders } from '../../lib/social';
import { ValueOf } from '@eunsatio.io/util/dist/type-def';
import {
  IsEmail,
  IsIn,
  IsOptional,
  MaxLength
} from 'class-validator';
import { GQLDuplicationError } from '../errors';
import {
  Field,
  ID,
  ObjectType,
  registerEnumType
} from 'type-graphql';
import {
  BeforeInsert,
  BeforeUpdate,
  Brackets,
  Column,
  CreateDateColumn,
  Entity,
  getRepository,
  PrimaryGeneratedColumn
} from 'typeorm';
import { SelfValidator } from './@model';
import { userRoles, UserRole } from '../roles/common';


export const userProviders = {
  email: 'email',
  ...socialProviders
} as const;
export type UserProvider = ValueOf<typeof userProviders>;

registerEnumType(userRoles, { name: 'UserRole' });
registerEnumType(userProviders, { name: 'UserProvider' });

const
userRoleList = Object.values(userRoles),
userProviderList = Object.values(userProviders);

@Entity()
@ObjectType()
export class User extends SelfValidator {

  @PrimaryGeneratedColumn('uuid')
  @Field(type => ID)
  id!: string;

  @Column()
  @Field()
  @IsEmail({ ignore_max_length: true })
  email!: string;

  @Column()
  @Field()
  username!: string;

  @Column({ length: 1024, select: false, nullable: true }) // can be `NULL` since social login won't require passwords
  @IsOptional()
  @MaxLength(1024)
  password?: string;

  @Column('set', { enum: userRoleList })
  @Field(type => [ userRoles ])
  @IsIn(userRoleList, { each: true })
  roles!: UserRole[];

  @Column('varchar', { length: 24 })
  @Field(type => userProviders)
  @IsIn(userProviderList)
  provider!: UserProvider;

  @Column({ unique: true, nullable: true })
  @Field({ nullable: true, description: 'social user\'s id' })
  uid?: string;

  @CreateDateColumn()
  @Field()
  joinedAt!: Date;

  @Column({ nullable: true })
  @Field({ nullable: true })
  profileImageUrl?: string;

  @Column({ default: false })
  @Field()
  blocked!: boolean;

  @Column({ default: false, select: false })
  deleted!: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  async checkUnique() {
    const { id = 'newbie', email, username, provider } = this;

    const query =  getRepository(User)
                  .createQueryBuilder('user')
                  .select('user.id')
                  .setParameters({ id, email, username, provider })
                  .where('user.id != :id')
                  .andWhere('user.provider = :provider')
                  .andWhere(new Brackets(subQuery => {

                    subQuery.where('user.email = :email')
                            .orWhere('user.username = :username');

                  }));

    const dupUser = await query.getOne();

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
  }

}
