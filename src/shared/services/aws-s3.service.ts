import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import type { ManagedUpload } from 'aws-sdk/clients/s3';
import { InjectAwsService } from 'nest-aws-sdk';
import { v4 as uuid } from 'uuid';

import { UtilsProvider } from '../../providers/utils.provider';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class S3Service {
  private readonly bucketName: string;

  constructor(
    @InjectAwsService(S3) private readonly s3: S3,
    private readonly configService: ApiConfigService,
  ) {
    this.bucketName = configService.bucketName;
  }

  async listBucketContents(bucket: string) {
    return this.s3.listObjectsV2({ Bucket: bucket }).promise();
  }

  async writeJSONInSystemIntegrationBucket(key: string, jsonData: JSON) {
    return this.s3
      .upload({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(jsonData),
        ContentType: 'application/json',
        ACL: 'public-read',
      })
      .promise();
  }

  async uploadFile(
    file: Express.Multer.File,
    root?: string,
    fileName?: string,
  ): Promise<ManagedUpload.SendData> {
    const fileNameEndingPart = fileName
      ? `/${fileName}`
      : `/${uuid()}-${file.originalname}`;
    const endingPart = root + fileNameEndingPart;

    return this.s3
      .upload({
        Bucket: this.bucketName,
        Key: endingPart,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read'
      })
      .promise();
  }

  async uploadText(text: string, root: string, keyName: string) {
    return this.s3
      .upload({
        Bucket: this.bucketName,
        Key: root + '/' + keyName,
        Body: text,
        ContentType: 'text/plain',
        ACL: 'public-read',
      })
      .promise();
  }

  async deleteObject(fileName: string) {
    await this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: fileName,
      })
      .promise();
  }

  generatePreSignedUrl(s3Uri: string, expiresIn: number = 60 * 5) {
    const s3Key = UtilsProvider.replaceS3UriWithS3Key(this.bucketName, s3Uri);
    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl('getObject', params);
  }
}
