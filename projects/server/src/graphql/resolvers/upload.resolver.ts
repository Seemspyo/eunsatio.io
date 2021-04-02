import { GraphQLUpload, FileUpload } from 'graphql-upload';
import {
  Arg,
  Authorized,
  Ctx,
  Mutation,
  Resolver
} from 'type-graphql';
import { GQLInvalidError } from '../../errors';
import { S3 } from 'aws-sdk';
import { config } from '../../config/api';
import { extname } from 'path';
import { getRepository } from 'typeorm';
import { UploadLog, uploadProviders } from '../../models';
import { GQLContext } from '../../graphql/@graphql';
import { canUploadImage } from '../../roles/common';


@Resolver()
export class UploadResolver {

  private s3 = config.s3 && new S3({
    credentials: {
      accessKeyId: config.s3.accessKey,
      secretAccessKey: config.s3.secretKey
    },
    region: config.s3.region
  });
  private bucket = config.s3?.bucket;
  private uploadRepo = getRepository(UploadLog);

  @Authorized(canUploadImage)
  @Mutation(returns => UploadLog)
  async uploadImage(
    @Ctx() { user, koaContext }: GQLContext,
    @Arg('image', type => GraphQLUpload) file: FileUpload
  ) {
    if (!(this.s3 && this.bucket)) {
      
      throw new GQLInvalidError();
    }

    const { filename, mimetype, createReadStream } = file;

    if (!/image\/(jpg|jpeg|gif|svg\+xml|tiff|webp|png|bmp)/i.test(mimetype)) {

      throw new GQLInvalidError('unsupported mime type');
    }

    const readStream = createReadStream();

    const
    now = new Date(),
    ext = extname(filename);

    const result = await this.s3.upload({
      Body: readStream,
      Bucket: this.bucket,
      ACL: 'public-read',
      Key: `images/${ now.getFullYear() }/${ now.getMonth() + 1 }/${ now.getDate() }/e${ now.getTime().toString(16) }${ ext }`,
      ContentType: 'mimetype',
      ServerSideEncryption: 'AES256',
      ContentDisposition: 'inline'
    }).promise();

    const { origin, pathname, href } = new URL(result.Location);

    const log = Object.assign(new UploadLog(), {
      userId: user!.id,
      from: koaContext.request.ip,
      provider: uploadProviders.s3,
      origin: config.s3!.originAlt || origin,
      path: pathname,
      href
    });

    return await this.uploadRepo.save(log);
  }

}
