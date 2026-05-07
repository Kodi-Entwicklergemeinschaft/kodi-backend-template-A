import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule, ConfigService } from '@kodi/config';
import { PrismaSchedulerModule } from '@kodi/prisma';
import { LoggerModule } from '@kodi/logger';
import { RmqModule } from '@kodi/rabbitmq';
import { RedisModule } from '@kodi/redis';
import { MetricsModule, MetricsInterceptor } from '@kodi/metrics';
import { LoggingInterceptor } from '@kodi/interceptors';
import { I18nModule, LanguageInterceptor } from '@kodi/i18n';
import { TasksModule } from './modules/tasks/tasks.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TerminusModule,
    PrismaSchedulerModule,
    LoggerModule,
    RmqModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({ serviceName: 'scheduler' }),
    }),
    RedisModule,
    MetricsModule,
    I18nModule,
    TasksModule,
    TranslationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LanguageInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
