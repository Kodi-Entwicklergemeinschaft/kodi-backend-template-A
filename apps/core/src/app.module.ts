import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@kodi/config';
import { PrismaCoreModule } from '@kodi/prisma';
import { LoggerModule } from '@kodi/logger';
import { RmqModule } from '@kodi/rabbitmq';
import { RedisModule } from '@kodi/redis';
import { MetricsModule, MetricsInterceptor } from '@kodi/metrics';
import {
  LoggingInterceptor,
  TransformInterceptor,
  SuccessMessageService,
} from '@kodi/interceptors';
import { I18nModule, LanguageInterceptor } from '@kodi/i18n';
import { TranslationModule } from '@kodi/translations';
import { TermsAcceptanceGuard } from '@kodi/rbac';
import { CoreModule } from './modules/core/core.module';
import { ListingsModule } from './modules/listings/listings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TilesModule } from './modules/tiles/tiles.module';
import { TagsModule } from './modules/tags/tags.module';
import { FiltersModule } from './modules/filters/filters.module';
import { HealthController } from './health.controller';
import { JwtModule } from '@kodi/jwt';
import { RBACModule } from '@kodi/rbac';
import { ErrorHandlingModule } from '@kodi/errors';
import { StorageModule } from '@kodi/storage';
import { TenancyModule } from '@kodi/tenancy';

@Module({
  imports: [
    ConfigModule,
    PrismaCoreModule,
    LoggerModule,
    StorageModule,
    RmqModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({ serviceName: 'core' }),
    }),
    RedisModule,
    MetricsModule,
    I18nModule,
    TranslationModule,
    JwtModule.register(),
    RBACModule,
    ErrorHandlingModule,
    TenancyModule,
    CoreModule,
    ListingsModule,
    TagsModule,
    FiltersModule,
    CategoriesModule,
    TilesModule,
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
