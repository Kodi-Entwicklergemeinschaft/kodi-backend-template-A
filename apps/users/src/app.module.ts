import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule, ConfigService } from '@kodi/config';
import { PrismaUsersModule } from '@kodi/prisma';
import { LoggerModule } from '@kodi/logger';
import { RmqModule } from '@kodi/rabbitmq';
import { JwtModule } from '@kodi/jwt';
import { MetricsModule, MetricsInterceptor } from '@kodi/metrics';
import {
  LoggingInterceptor,
  TimeoutInterceptor,
  TransformInterceptor,
  SuccessMessageService,
  ValidationInterceptor,
} from '@kodi/interceptors';
import { I18nModule, LanguageInterceptor } from '@kodi/i18n';
import { ErrorHandlingModule } from '@kodi/errors';
import { TermsAcceptanceGuard } from '@kodi/rbac';
import { StorageModule } from '@kodi/storage';
import { UsersModule } from './modules/users/users.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule,
    TerminusModule,
    PrismaUsersModule,
    LoggerModule,
    StorageModule,
    RmqModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({ serviceName: 'users' }),
    }),
    JwtModule.register(),
    MetricsModule,
    I18nModule,
    ErrorHandlingModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LanguageInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (configService: ConfigService) => {
        const timeoutMs = configService.get<number>('requestTimeoutMs', 30000);
        return new TimeoutInterceptor(timeoutMs);
      },
      inject: [ConfigService],
    },
    SuccessMessageService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ValidationInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: TermsAcceptanceGuard,
    },
  ],
})
export class AppModule {}
