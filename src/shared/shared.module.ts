import { HttpModule } from '@nestjs/axios';
import { Global, Logger, Module } from '@nestjs/common';
import { S3, SSM } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';

import { TypeOrmExModule } from '../db/typeorm-ex.module';
import { UrlRepository } from './repositories/url.repository';
import { ApiConfigService } from './services/api-config.service';
import { PollyService } from './services/aws-polly.service';
import { S3Service } from './services/aws-s3.service';
import { CloudWatchLoggerService } from './services/cloud-watch-logger.service';
import { EnhancedLoggerService } from './services/enhanced-logger.service';
import { MailService } from './services/mail.service';
import { SlackNotificationService } from './services/slack-notification.service';
import { SsmService } from './services/ssm.service';
import { UrlService } from './services/url.service';

const providers = [
  ApiConfigService,
  S3Service,
  Logger,
  SsmService,
  MailService,
  UrlService,
  CloudWatchLoggerService,
  SlackNotificationService,
  PollyService,
  EnhancedLoggerService,
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
