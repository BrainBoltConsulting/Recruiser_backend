import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { setupSwagger } from './setup-swagger';
import { ApiConfigService } from './shared/services/api-config.service';

async function bootstrap() {
  initializeTransactionalContext();
  
  const httpsOptions = {
    key: fs.readFileSync('/home/ec2-user/certs/key.pem'),
    cert: fs.readFileSync('/home/ec2-user/certs/cert.pem'),
  };

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    httpsOptions,
  });
  
  const config = app.select(AppModule).get(ApiConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      dismissDefaultMessages: true,
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    }),
  );
  setupSwagger(app, { version: '1.0.0' });
  app.enableCors();

  await app.listen(config.appConfig.port);
  console.info(`server running on port ${config.appConfig.port}`);

  return app;
}

bootstrap();