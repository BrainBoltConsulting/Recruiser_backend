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

  async createMultipartUpload(key: string) {
    return this.s3.createMultipartUpload({ Bucket: this.bucketName, Key: key }).promise();
  }
  
  async uploadPart(key: string, uploadId: string, partNumber: number, body: Buffer) {
    return this.s3.uploadPart({
      Bucket: this.bucketName,
      Key: key,
      PartNumber: partNumber,
      UploadId: uploadId,
      Body: body,
    }).promise();
  }
  
  async completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string, PartNumber: number }[]) {
    const sortedParts = parts
      .map(p => ({ ETag: p.ETag, PartNumber: Number(p.PartNumber) }))
      .sort((a, b) => a.PartNumber - b.PartNumber);

    console.log('sortedParts', sortedParts);
    return this.s3.completeMultipartUpload({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: sortedParts },
    }).promise();
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

  generatePublicUrl(s3Uri: string): string {
    const s3Key = UtilsProvider.replaceS3UriWithS3Key(this.bucketName, s3Uri);

    return `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`;
  }

  /**
   * Generate a presigned URL for email images with extended expiration time.
   * Handles both S3 URI format (s3://bucket/key) and plain key format.
   * @param s3KeyOrUri - Either an S3 URI or a plain S3 key
   * @param expiresIn - Expiration time in seconds (default: 7 days for email images)
   * @returns Presigned URL string
   */
  generatePresignedUrlForEmail(s3KeyOrUri: string | null, expiresIn: number = 60 * 60 * 24 * 7): string | null {
    if (!s3KeyOrUri) {
      return null;
    }

    // Check if it's already an S3 URI (starts with s3://)
    let s3Key: string;
    if (s3KeyOrUri.startsWith('s3://')) {
      s3Key = UtilsProvider.replaceS3UriWithS3Key(this.bucketName, s3KeyOrUri);
    } else {
      // It's already a key
      s3Key = s3KeyOrUri;
    }

    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl('getObject', params);
  }
}
