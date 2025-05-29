import { UtilsProvider } from './../../providers/utils.provider';
import { Injectable } from '@nestjs/common';
import { S3, SharedIniFileCredentials } from 'aws-sdk';
import type { GetObjectRequest, ManagedUpload } from 'aws-sdk/clients/s3';
import { InjectAwsService } from 'nest-aws-sdk';
import { v4 as uuid } from 'uuid';
import { ApiConfigService } from './api-config.service';
import { BadRequestException } from '@nestjs/common/exceptions';

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
        ACL: 'public-read'
      })
      .promise();
  }

  async uploadFile(file: Express.Multer.File, root?: any, fileName?: string): Promise<ManagedUpload.SendData> {
    const fileNameEndingPart = fileName ? `/${fileName}` : `/${uuid()}-${file.originalname}`;
    let endingPart = root + fileNameEndingPart;

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

  async uploadBuffer(buffer: any, fileType: string, fileName: string) {
    let endingPart = `/${uuid()}-${fileName}`
    let key = 'other';
    return this.s3
      .upload({
        Bucket: this.bucketName,
        Key: key + endingPart,
        Body: buffer,
        ContentType: fileType,
        ACL: 'public-read'
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
        ACL: 'public-read'
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

  async getObject(fileName: string, isSystemIntegrationBucket?: boolean) {
    if (process.env.LOCAL_AWS_ACCOUNT_NAME) {
      const credentials = new SharedIniFileCredentials({ profile: process.env.LOCAL_AWS_ACCOUNT_NAME });
      this.s3.config.credentials = credentials;
    }

    return new Promise((res, rej) => {
        this.s3.getObject({
        Bucket: this.bucketName,
        Key: fileName
      }, (err, data) => {
        if (err) {
          if (err.statusCode === 404) {
            return rej(new BadRequestException(`File is not found: ${fileName}`))
          }
          console.error('Error reading file from S3:', err);
        } else {
          // const buffer = Buffer.concat(data?.Body as any);
          // const text = buffer.toString('utf-8'); 
          // console.log(text)
          //console.log(Buffer.concat(data.Body))
          return res(data.Body);
        }
      });
    })
  }

  async getText(key: string): Promise<string> {
    const params: GetObjectRequest = { Bucket: this.bucketName, Key: key };

    try {
      const data = await this.s3.getObject(params).promise();
      const text = data.Body?.toString('utf-8');
      return text ?? '';
    } catch (error) {
      throw error;
    }
  }

  async getObjectWithMetadata(fileName: string) {
    return new Promise((res, rej) => {
      this.s3.headObject({
        Bucket: this.bucketName,
        Key: fileName
      }, (err, data) => {
        if (err) {
          console.log(err)
          if (err.code === 'NotFound') {
            rej('Object does not exist.');
          } else {
            rej(err);
          }
        } else {
          res(`Object exists`);
        }
      });  
    })
  }

  async generatePreSignedUrl(s3Uri: string, expiresIn: number = 60 * 5) {

    const s3Key = UtilsProvider.replaceS3UriWithS3Key(this.bucketName, s3Uri)
    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
      Expires: expiresIn
    };

    return this.s3.getSignedUrl('getObject', params);
  }
}
