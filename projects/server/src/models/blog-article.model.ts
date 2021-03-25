import {
  IsOptional,
  MaxLength
} from 'class-validator';
import {
  Field,
  ID,
  ObjectType
} from 'type-graphql';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  getRepository,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { SelfValidator } from './@model';
import { User } from './user.model';
import { BlogSeries } from './blog-series.model';
import { GQLDuplicationError } from '../errors';


@Entity()
@ObjectType()
export class BlogArticle extends SelfValidator {

  @PrimaryGeneratedColumn('uuid')
  @Field(type => ID)
  id!: string;

  @ManyToOne(type => User)
  @Field(type => User, { nullable: true, description: 'author can be `null` if author resigned or blocked.' })
  author?: User;

  @ManyToMany(type => User)
  @JoinTable()
  @Field(type => [ User ], { nullable: true, description: 'the users who modifies article (except author)' })
  collaborators?: User[];

  @Column({ length: 256, unique: true })
  @Field({ description: 'article\'s uri component' })
  @MaxLength(256)
  uri!: string;

  @Column({ length: 256 })
  @Field()
  @MaxLength(256)
  title!: string;

  @Column('text', { select: false })
  @Field({ nullable: true, description: '`content` might be `null` in list request. for optimization.' })
  content!: string;

  @Column({ length: 256, nullable: true })
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(256)
  description?: string;

  @ManyToOne(type => BlogSeries)
  @Field(type => BlogSeries, { nullable: true })
  series?: BlogSeries;

  @Column('simple-array', { default: '' })
  @Field(() => [ String ])
  tags!: string[];

  @Column({ nullable: true })
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(255)
  thumbnailUrl?: string;

  @Column({ default: true })
  @Field()
  isDraft!: boolean;

  @Column({ default: false })
  @Field()
  locked!: boolean;

  @CreateDateColumn()
  @Field()
  createdAt!: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async checkUnique() {
    const { id = 'new-article', uri } = this;

    const dupArticle = await getRepository(BlogArticle)
                            .createQueryBuilder('article')
                            .setParameters({ id, uri })
                            .where('article.id != :id')
                            .andWhere('article.uri = :uri')
                            .getOne();

    if (dupArticle) {

      throw new GQLDuplicationError({ uri });
    }
  }

}
