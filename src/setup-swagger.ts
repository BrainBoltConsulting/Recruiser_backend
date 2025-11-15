import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Determine base URL based on environment
// Priority: Environment-specific env vars > API_BASE_URL > environment-based default
function getBaseUrl(nodeEnv: string): string {
  // Check for environment-specific URL first
  if (nodeEnv === 'production' && process.env.PRODUCTION_API_BASE_URL) {
    return process.env.PRODUCTION_API_BASE_URL;
  }

  if (nodeEnv === 'test' && process.env.TEST_API_BASE_URL) {
    return process.env.TEST_API_BASE_URL;
  }

  // Check if API_BASE_URL is explicitly set (fallback)
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  // Environment-based defaults
  if (nodeEnv === 'test') {
    // Test environment uses the nginx base path
    return 'https://backend.hire2o.com/nodeapi';
  }

  if (nodeEnv === 'production') {
    // Production environment - should be set via PRODUCTION_API_BASE_URL env var
    // Default fallback (should be overridden in production)
    return (
      process.env.PRODUCTION_API_BASE_URL ||
      'https://backend.hire2o.com/nodeapi'
    );
  }

  // For local development, use localhost
  return 'http://localhost:3000';
}

export function setupSwagger(
  app: INestApplication,
  options: { version: string },
): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const baseUrl = getBaseUrl(nodeEnv);

  // Create document builder with server configurations
  const documentBuilder = new DocumentBuilder()
    .setTitle('API')
    .setVersion(options.version)
    .addBearerAuth()
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'cognito',
    );

  // Add server configurations based on environment
  if (nodeEnv === 'production') {
    // For production, add the production server URL
    documentBuilder.addServer(baseUrl, 'Production Server');
  } else if (nodeEnv === 'test') {
    // For test environment
    documentBuilder.addServer(baseUrl, 'Test Server');
  } else {
    // For development, add local server
    documentBuilder.addServer(baseUrl, 'Local Development');
  }

  const document = SwaggerModule.createDocument(app, documentBuilder.build());
  SwaggerModule.setup('/documentation', app, document);

  console.info(
    'Swagger documentation is running. You can access it at /documentation url',
  );
  console.info(
    `Swagger configured for environment: ${nodeEnv} with base URL: ${baseUrl}`,
  );
}
