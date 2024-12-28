import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(
  app: INestApplication,
  options: { version: string },
): void {
  const isServerless = process.env.IS_SERVERLESS;
  let documentBuilderWithBasePath = new DocumentBuilder()
    .setTitle('API')
    .setVersion(options.version)
    .addBearerAuth()
    .addServer('/prod')
    .build();
    
  let documentBuilder =  new DocumentBuilder()
    .setTitle('API')
    .setVersion(options.version)
    .addBearerAuth()
    .build();

  let targetBuilder = documentBuilder;

  // if (isServerless !== 'false') {
  //   targetBuilder = documentBuilderWithBasePath
  // }

  const document = SwaggerModule.createDocument(app, targetBuilder);
  SwaggerModule.setup('/documentation', app, document);

  console.info(
    'Swagger documentation is running. You can access it bt /documentation url',
  );
}
