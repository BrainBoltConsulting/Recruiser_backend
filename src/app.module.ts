import { SkillModule } from './modules/skill/skill.module';
import './boilerplate.polyfill';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { AwsSdkModule } from 'nest-aws-sdk';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { contextMiddleware } from './contex.middleware';
import { CandidateModule } from './modules/candidate/candidate.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from "./modules/auth/auth.module";
import { AgoraModule } from './modules/agora/agora.module';
import { QuestionModule } from './modules/question/question.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { S3Module } from './modules/s3/s3.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    AgoraModule,
    CandidateModule,
    QuestionModule,
    MeetingModule,
    S3Module,
    SkillModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (apiConfigService: ApiConfigService) =>
        apiConfigService.typeOrmConfig,
      async dataSourceFactory(options) {
        try {
          console.log(options)
          if (!options) {
            throw new Error('Invalid options passed');
          }
  
          return addTransactionalDataSource(new DataSource(options));
        } catch (err) {
          console.log(err)
        }
        
      },
      inject: [ApiConfigService],
    }),
    MulterModule.register({
      dest: './passportFiles',
    }),
    AwsSdkModule.forRootAsync({
      defaultServiceOptions: {
        useFactory: (apiConfigService: ApiConfigService) =>
          apiConfigService.awsConfig,
        inject: [ApiConfigService],
      },
    }),
    MailerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => configService.mailConfig,
      inject: [ApiConfigService],
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(contextMiddleware).forRoutes('*');
  }
}