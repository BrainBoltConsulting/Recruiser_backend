import { S3Service } from './../../shared/services/aws-s3.service';
import { Controller, Get, HttpCode, HttpStatus, Post, Query, Res, Body, Delete, Param, Header, Redirect } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';


@Controller('s3')
@ApiTags('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) { }

  @Get('/generate-presigned')
  @HttpCode(HttpStatus.OK)
  @Redirect()
  async getAllQuestions(
    @Query('s3Uri') s3Uri: string,
  ) {
      return { url: await this.s3Service.generatePreSignedUrl(s3Uri)}
  }
}
