import {
  MaxLength
} from 'class-validator';
import {
  Field,
  ID,
  ObjectType
} from 'type-graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { SelfValidator } from './@model';
import { BlogArticle } from './blog-article.model';
import { User } from './user.model';


@Entity()
@ObjectType()
export class BlogComment extends SelfValidator {

  @PrimaryGeneratedColumn('uuid')
  @Field(type => ID)
  id!: string;

  @ManyToOne(type => BlogArticle, { nullable: true })
  @Field(type => BlogArticle, { nullable: true, description: 'this can be `null` since article can be removed, and this field has no use for public' })
  article?: BlogArticle;

  @ManyToOne(type => BlogComment, { nullable: true })
  @Field(type => BlogComment, { nullable: true })
  parent?: BlogComment;

  @ManyToOne(type => User, { nullable: true })
  @Field(type => User, { nullable: true, description: 'author can be `null` if author resigned or blocked.' })
  author?: User;

  @Column({ length: 512 })
  @Field()
  @MaxLength(512)
  content!: string;

  @Column('text', { nullable: true, select: false })
  deletedContent?: string;

  @CreateDateColumn()
  @Field()
  createdAt!: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt!: Date;

  @Column({ default: false })
  @Field()
  deleted!: boolean;

}
