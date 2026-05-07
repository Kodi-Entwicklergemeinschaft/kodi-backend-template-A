import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from '@kodi/logger';
import { ConfigService, getSwaggerServerUrl, getSwaggerI18nOptions } from '@kodi/config';
import { getRmqConsumerOptions } from '@kodi/rabbitmq';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = await app.resolve(LoggerService);
  logger.setContext('Core-Service');
  app.useLogger(logger);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        },
      },
    }),
  );
  const configService = app.get(ConfigService);
  app.enableCors({ origin: configService.get<string>('corsOrigin', '*'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  // Connect RabbitMQ microservice (for request-response patterns)
  // Uses service-specific queue with topic exchange routing
  app.connectMicroservice<MicroserviceOptions>(getRmqConsumerOptions(configService, 'core'));

  await app.startAllMicroservices();
  logger.log('RabbitMQ microservice connected');

  const swaggerConfig = configService.swaggerConfig;
  const swaggerTitle = `Core Service | ${swaggerConfig.title || 'KODI Microservices API'}`;
  const serverUrl = getSwaggerServerUrl(configService, 'core');

  const documentBuilder = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerConfig.description || 'API documentation for KODI Core Service')
    .setVersion(swaggerConfig.version || '1.0');

  if (serverUrl) {
    documentBuilder.addServer(serverUrl, 'API Gateway Path');
  }

  const swaggerDocumentConfig = documentBuilder
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag(
      'core',
      'Core service operations and shared infrastructure endpoints (including translated parking data and background jobs).',
    )
    .addTag(
      'listings',
      'Listings management endpoints. Responses are automatically translated based on the current request language (see Swagger language selector / Accept-Language header).',
    )
    .addTag(
      'categories',
      'Listing category endpoints. Category trees and city category assignments are translated according to the current request language.',
    )
    .addTag(
      'favorites',
      'User favorites endpoints, returning translated listing data when a non-default language is selected.',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerDocumentConfig);
  const swaggerI18nOptions = getSwaggerI18nOptions(configService);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    ...swaggerI18nOptions,
    swaggerOptions: {
      ...swaggerI18nOptions.swaggerOptions,
    },
  });

  const port = configService.get<number>('core.port', 3004);
  await app.listen(port);

  logger.log(`🚀 Core service is running on: http://localhost:${port}`);
  logger.log(`📊 Metrics available at: http://localhost:${port}/metrics`);
  logger.log(`💚 Health check at: http://localhost:${port}/healthz`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
}

bootstrap();
