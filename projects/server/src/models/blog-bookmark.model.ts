import {
  Field,
  ID,
  ObjectType
} from 'type-graphql';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { SelfValidator } from './@model';
import { BlogArticle } from './blog-article.model';


@Entity()
@ObjectType()
export class BlogBookmark extends SelfValidator {

  @PrimaryGeneratedColumn('uuid')
  @Field(type => ID)
  id!: string;

  @Column({ select: false }) // for internal use. since no needs to see others bookmarks.
  userId!: string;

  @ManyToOne(type => BlogArticle)
  @Field(type => BlogArticle, { description: 'target article' })
  target!: BlogArticle;

}
