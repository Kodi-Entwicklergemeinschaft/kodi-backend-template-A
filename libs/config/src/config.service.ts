import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get<T = any>(key: string, defaultValue?: T): T {
    if (defaultValue !== undefined) {
      return this.configService.get<T>(key, defaultValue);
    }
    return this.configService.get<T>(key) ?? (defaultValue as T);
  }

  getOrThrow<T = any>(key: string): T {
    return this.configService.getOrThrow<T>(key);
  }

  // Auth service configuration
  get authPort(): string {
    return this.get<string>('auth.port');
  }

  get authDatabaseConfig() {
    return {
      host: this.get<string>('auth.database.host'),
      port: this.get<number>('auth.database.port'),
      user: this.get<string>('auth.database.user'),
      password: this.get<string>('auth.database.password'),
      dbName: this.get<string>('auth.database.dbName'),
    };
  }

  // Users service configuration
  get usersPort(): string {
    return this.get<string>('users.port');
  }

  get usersDatabaseConfig() {
    return {
      host: this.get<string>('users.database.host'),
      port: this.get<number>('users.database.port'),
      user: this.get<string>('users.database.user'),
      password: this.get<string>('users.database.password'),
      dbName: this.get<string>('users.database.dbName'),
    };
  }

  // Core service configuration
  get corePort(): string {
    return this.get<string>('core.port');
  }

  get coreDatabaseConfig() {
    return {
      host: this.get<string>('core.database.host'),
      port: this.get<number>('core.database.port'),
      user: this.get<string>('core.database.user'),
      password: this.get<string>('core.database.password'),
      dbName: this.get<string>('core.database.dbName'),
    };
  }

  // City service configuration
  get cityPort(): string {
    return this.get<string>('city.port');
  }

  get cityDatabaseConfig() {
    return {
      host: this.get<string>('city.database.host'),
      port: this.get<number>('city.database.port'),
      user: this.get<string>('city.database.user'),
      password: this.get<string>('city.database.password'),
      dbName: this.get<string>('city.database.dbName'),
    };
  }

  // Notification service configuration
  get notificationPort(): string {
    return this.get<string>('notification.port');
  }

  get notificationDatabaseConfig() {
    return {
      host: this.get<string>('notification.database.host'),
      port: this.get<number>('notification.database.port'),
      user: this.get<string>('notification.database.user'),
      password: this.get<string>('notification.database.password'),
      dbName: this.get<string>('notification.database.dbName'),
    };
  }

  // Scheduler service configuration
  get schedulerPort(): string {
    return this.get<string>('scheduler.port');
  }

  get schedulerDatabaseConfig() {
    return {
      host: this.get<string>('scheduler.database.host'),
      port: this.get<number>('scheduler.database.port'),
      user: this.get<string>('scheduler.database.user'),
      password: this.get<string>('scheduler.database.password'),
      dbName: this.get<string>('scheduler.database.dbName'),
    };
  }

  // JWT configuration
  get jwtSecret(): string {
    return this.getOrThrow<string>('jwt.secret');
  }

  get jwtExpiresIn(): string {
    return this.get<string>('jwt.expiresIn');
  }

  get jwtRefreshSecret(): string {
    return this.getOrThrow<string>('jwt.refreshSecret');
  }

  get jwtRefreshExpiresIn(): string {
    return this.get<string>('jwt.refreshExpiresIn');
  }

  // RabbitMQ configuration
  get rabbitmqConfig() {
    return {
      host: this.get<string>('rabbitmq.host'),
      port: this.get<number>('rabbitmq.port'),
      user: this.get<string>('rabbitmq.user'),
      password: this.get<string>('rabbitmq.password'),
      vhost: this.get<string>('rabbitmq.vhost'),
    };
  }

  // Redis configuration
  get redisConfig() {
    return {
      host: this.get<string>('redis.host'),
      port: this.get<number>('redis.port'),
      password: this.get<string>('redis.password'),
    };
  }

  // Hetzner Object Storage configuration
  get storageConfig() {
    return {
      endpoint: this.get<string>('storage.endpoint'),
      region: this.get<string>('storage.region', 'fsn1'),
      accessKeyId: this.get<string>('storage.accessKeyId'),
      secretAccessKey: this.get<string>('storage.secretAccessKey'),
      defaultBucket: this.get<string>('storage.defaultBucket'),
    };
  }

  // Swagger configuration
  get swaggerConfig() {
    return {
      title: this.get<string>('swagger.title'),
      description: this.get<string>('swagger.description'),
      version: this.get<string>('swagger.version'),
    };
  }

  // API prefix
  get apiPrefix(): string {
    return this.get<string>('apiPrefix');
  }

  // Email configuration
  get systemEmailId(): string {
    return this.get<string>('systemEmailId');
  }

  // SMTP configuration
  get smtpConfig() {
    return this.get('smtp');
  }

  get smtpHost(): string {
    return this.get<string>('smtp.host', 'smtp.gmail.com');
  }

  get smtpPort(): number | undefined {
    return this.get<number>('smtp.port');
  }

  get smtpSecure(): boolean | undefined {
    return this.get<boolean>('smtp.secure');
  }

  get smtpPath(): string | undefined {
    return this.get<string>('smtp.path');
  }

  get smtpUser(): string {
    return this.get<string>('smtp.auth.user');
  }

  get smtpPassword(): string {
    return this.get<string>('smtp.auth.pass');
  }

  get smtpFrom(): string {
    return this.get<string>('smtp.from', 'noreply@kodi.example.com');
  }

  // Client URL
  get clientURL(): string {
    return this.get<string>('clientURL');
  }

  // Application configuration
  get corsOrigin(): string {
    return this.get<string>('corsOrigin', '*');
  }

  get enableFileLogging(): boolean {
    return this.get<boolean>('enableFileLogging', false);
  }

  get requestTimeoutMs(): number {
    return this.get<number>('requestTimeoutMs', 30000);
  }

  // Throttling configuration
  get throttleConfig() {
    return {
      ttl: this.get<number>('throttle.ttl', 60),
      limit: this.get<number>('throttle.limit', 100),
    };
  }

  // Password reset configuration
  get passwordResetExpiryHours(): number {
    return this.get<number>('passwordReset.expiryHours', 1);
  }

  get passwordResetMaxAttempts(): number {
    return this.get<number>('passwordReset.maxAttempts', 3);
  }

  // RabbitMQ configuration helpers
  get rabbitmqUrl(): string {
    return this.get<string>('rabbitmq.url', 'amqp://localhost:5672');
  }

  get rabbitmqQueue(): string {
    return this.get<string>('rabbitmq.queue', 'kodi_queue');
  }

  // Logging configuration
  get logDir(): string {
    return this.get<string>('logDir', './logs');
  }

  get logLevel(): string {
    return this.get<string>('logLevel', 'info');
  }

  // Push notification default language (for FCM notifications)
  get pushNotificationDefaultLanguage(): string {
    return this.get<string>('i18n.pushNotificationDefaultLanguage', 'de');
  }

  // Translations / DeepL configuration
  get translationsConfig() {
    return this.get('translations');
  }

  get translationsDefaultSourceLocale(): string {
    return this.get<string>('translations.defaultSourceLocale', 'en');
  }

  get translationsAutoTranslateOnRead(): boolean {
    return this.get<boolean>('translations.autoTranslateOnRead', true);
  }

  get translationsAutoTranslateOnSync(): boolean {
    return this.get<boolean>('translations.autoTranslateOnSync', true);
  }

  get deeplApiKey(): string {
    return this.get<string>('translations.deepl.apiKey', '');
  }

  get deeplApiUrl(): string {
    return this.get<string>('translations.deepl.apiUrl', 'https://api-free.deepl.com/v2/translate');
  }
}
