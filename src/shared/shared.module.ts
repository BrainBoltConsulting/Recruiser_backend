import { PollyService } from './services/aws-polly.service';
import { HttpModule } from '@nestjs/axios';
import { Global, Logger, Module } from '@nestjs/common';
import { S3, SSM } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';
import { ApiConfigService } from './services/api-config.service';
import { S3Service } from './services/aws-s3.service';
import { MailService } from './services/mail.service';
import {UrlService} from "./services/url.service";
import {TypeOrmExModule} from "../db/typeorm-ex.module";
import { UrlRepository } from './repositories/url.repository';
import { SsmService } from './services/ssm.service';

const providers = [
  ApiConfigService,
  S3Service,
  Logger,
  SsmService,
  MailService,
  UrlService,
  PollyService
];

@Global()
@Module({
  imports: [
    HttpModule,
    AwsSdkModule.forFeatures([S3, SSM]),
    TypeOrmExModule.forCustomRepository([UrlRepository]),
  ],
  exports: [...providers, HttpModule],
  providers,
})
export class SharedModule {}
