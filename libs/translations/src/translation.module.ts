import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@kodi/config';
import { LoggerModule } from '@kodi/logger';
import { PrismaCoreModule } from '@kodi/prisma';
import { I18nModule } from '@kodi/i18n';
import { RmqModule } from '@kodi/rabbitmq';
import { TranslationService } from './translation.service';
import { DatabaseProvider } from './providers/database.provider';
import { DeepLProvider } from './providers/deepl.provider';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule, HttpModule, PrismaCoreModule, I18nModule, RmqModule],
  providers: [TranslationService, DatabaseProvider, DeepLProvider],
  exports: [TranslationService, DatabaseProvider, DeepLProvider],
})
export class TranslationModule {}
