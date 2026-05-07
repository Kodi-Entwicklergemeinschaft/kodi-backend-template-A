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
  logger.setContext('City-Service');
  app.useLogger(logger);

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for Swagger UI
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // Allow inline styles and Google Fonts
          fontSrc: ["'self'", 'https://fonts.gstatic.com'], // Allow Google Fonts font files
        },
      },
    }),
  );
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('corsOrigin', '*'),
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  // Connect RabbitMQ microservice (for request-response patterns)
  // Uses service-specific queue with topic exchange routing
  app.connectMicroservice<MicroserviceOptions>(getRmqConsumerOptions(configService, 'city'));

  await app.startAllMicroservices();
  logger.log('RabbitMQ microservice connected');

  // Swagger setup
  const swaggerConfig = configService.swaggerConfig;
  const swaggerTitle = `City Service | ${swaggerConfig.title || 'KODI Microservices API'}`;
  const serverUrl = getSwaggerServerUrl(configService, 'city');

  const documentBuilder = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerConfig.description || 'API documentation for KODI City Service')
    .setVersion(swaggerConfig.version || '1.0');

  // Only add server URL if API gateway prefix is enabled (for production/server)
  if (serverUrl) {
    documentBuilder.addServer(serverUrl, 'API Gateway Path');
  }

  const config = documentBuilder
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
    .addTag('city', 'City endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Use i18n-enabled Swagger options (language selector + Accept-Language header)
  const swaggerI18nOptions = getSwaggerI18nOptions(configService);

  SwaggerModule.setup('docs', app, document, {
    ...swaggerI18nOptions,
    swaggerOptions: {
      ...swaggerI18nOptions.swaggerOptions,
    },
  });

  const port = configService.get<number>('city.port', 3003);
  await app.listen(port);

  logger.log(`🚀 City service is running on: http://localhost:${port}`);
  logger.log(`📊 Metrics available at: http://localhost:${port}/metrics`);
  logger.log(`💚 Health check at: http://localhost:${port}/healthz`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
}

bootstrap();
