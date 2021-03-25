import {
  MaxLength
} from 'class-validator';
import { GQLDuplicationError } from '../errors';
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
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { SelfValidator } from './@model';
import { BlogArticle } from './blog-article.model';


@Entity()
@ObjectType()
export class BlogSeries extends SelfValidator {

  @PrimaryGeneratedColumn('uuid')
  @Field(type => ID)
  id!: string;

  @Column({ unique: true })
  @Field({ description: 'series name, use this value as id instead of auto generated one.' })
  name!: string;

  @Column({ length: 128 })
  @Field()
  @MaxLength(128)
  title!: string;

  @Column({ length: 256, nullable: true })
  @Field()
  @MaxLength(256)
  description?: string;

  @Column({ default: false })
  @Field({ description: 'if series is `locked`, means article belongs to series also not public.' })
  locked!: boolean;

  @CreateDateColumn()
  @Field()
  createdAt!: Date;

  @OneToMany(type => BlogArticle, article => article.series)
  @Field(type => [ BlogArticle ], { nullable: true })
  articles!: BlogArticle[];

  @BeforeInsert()
  @BeforeUpdate()
  async checkUnique() {
    const { id = 'new-series', name } = this;

    const dupSeries = await getRepository(BlogSeries)
                            .createQueryBuilder('series')
                            .setParameters({ id, name })
                            .where('series.id != :id')
                            .andWhere('series.name = :name')
                            .getOne();

    if (dupSeries) {

      throw new GQLDuplicationError({ name });
    }
  }

}
