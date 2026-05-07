import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule, ConfigService } from '@kodi/config';
import { PrismaNotificationModule } from '@kodi/prisma';
import { LoggerModule } from '@kodi/logger';
import { RmqModule } from '@kodi/rabbitmq';
import { MetricsModule, MetricsInterceptor } from '@kodi/metrics';
import {
  LoggingInterceptor,
  TransformInterceptor,
  SuccessMessageService,
} from '@kodi/interceptors';
import { I18nModule, LanguageInterceptor } from '@kodi/i18n';
import { TermsAcceptanceGuard } from '@kodi/rbac';
import { NotificationModule } from './modules/notification/notification.module';
import { VerificationModule } from './modules/verification/verification.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';
import { HealthController } from './health.controller';
import { ErrorHandlingModule } from '@kodi/errors';

@Module({
  imports: [
    ConfigModule,
    TerminusModule,
    PrismaNotificationModule,
    LoggerModule,
    RmqModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({ serviceName: 'notification' }),
    }),
    MetricsModule,
    I18nModule,
    ErrorHandlingModule,
    NotificationModule,
    VerificationModule,
    PasswordResetModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LanguageInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    SuccessMessageService,
    {
      provide: APP_GUARD,
      useClass: TermsAcceptanceGuard,
    },
  ],
})
export class AppModule {}
