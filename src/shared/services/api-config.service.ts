import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { IAwsS3Config } from '../../modules/common/interfaces/IAwsS3Config';

@Injectable()
export class ApiConfigService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  private getNumber(key: string): number {
    return Number(this.configService.get(key));
  }

  private getString(key: string, defaultValue?: string): string {
    return this.configService
      .get(key, defaultValue)
      .toString()
      .replace(/\\n/g, '\n');
  }

  get appConfig() {
    return {
      port: this.getNumber('PORT'),
      frontendUrl: this.getString('FRONTEND_URL'),
    };
  }

  get appUrls() {
    return {
      emailVerifyRoute: this.appConfig.frontendUrl + this.getString('EMAIL_VERIFY_ROUTE'),
      resetPasswordRoute: this.appConfig.frontendUrl + this.getString('RESET_PASSWORD_ROUTE'),
      setPasswordRoute: this.appConfig.frontendUrl + this.getString('SET_PASSWORD_ROUTE')
    }
  }

  get agoraConfig() {
    return {
        appId: this.getString('AGORA_APP_ID'),
        appCertificate: this.getString('AGORA_APP_CERTIFICATE')
    }
  }

  get xlsxFilepath() {
    return this.getString('XLSX_FILE_KEY')
  }

  get firebaseApiKey() {
    return this.getString('FIREBASE_API_KEY')
  }

  get cloudFrontUrl() {
    return this.getString('CLOUD_FRONT_URL') || ''
  }

  get frontendUrl() {
    return this.getString('FRONTEND_URL');
  }

  get typeOrmConfig(): TypeOrmModuleOptions {
    const data: TypeOrmModuleOptions = {
      entities: [__dirname + '/../../entities/*'],
      type: 'postgres',
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      username: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_DATABASE'),
      logging: true,
      synchronize: false,
      ssl: {
        rejectUnauthorized: false
      }
    };

    return data;
  }

  get bucketName() {
    return this.getString('BUCKET_NAME');
  }

  get systemIntegrationBucketName() {
    return this.getString('SYSTEM_INTEGRATION_BUCKET_NAME');
  }

  get adminEmail() {
    return this.getString('ADMIN_EMAIL');
  }

  get adminUrl() {
    return this.getString('ADMIN_URL');
  }

  get slackWebhookUrl() {
    return this.getString('SLACK_WEBHOOK_URL');
  }

  get awsConfig(): IAwsS3Config {
    return {
      region: this.getString('AWS_REGION'),
      cloudWatchInterviewGroupName: this.getString('AWS_CLOUD_WATCH_INTERVIEW_NAME'),
      credentials: {
        accessKeyId: `${this.getString('AWS_ACCESS_KEY_ID')}`,
        secretAccessKey: this.getString('AWS_SECRET_ACCESS_KEY'),
      },
    };
  }

  get jwtConfig() {
    return {
      secret: this.getString('JWT_SECRET_KEY'),
      accessTokenExpiry: this.getNumber('JWT_AUTH_EXPIRATION_TIME'),
      refreshTokenExpiry: this.getNumber('JWT_REFRESH_EXPIRATION_TIME'),
    };
  }

  get zohoConfig() {
    return {
      zohoClientId: this.getString('ZOHO_CLIENT_ID'),
      zohoClientSecret: this.getString('ZOHO_CLIENT_SECRET'),
      zohoScope: this.getString('ZOHO_SCOPE')
    };
  }

  get mailConfig() {
    return {
      transport: {
        host: this.getString('MAIL_SES_HOST'),
        port: this.getNumber('MAIL_SES_PORT'),
        secure: true,
        auth: {
          user: this.getString('MAIL_USER'),
          pass: this.getString('MAIL_PASSWORD'),
        },
      },
    };
  }

  get defoultMailFrom() {
    return this.getString('MAIL_FROM');
  }
}
