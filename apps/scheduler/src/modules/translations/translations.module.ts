import { Module } from '@nestjs/common';
import { TranslationModule } from '@kodi/translations';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule } from '@kodi/config';
import { RmqModule } from '@kodi/rabbitmq';
import { TranslationHandlerService } from './translation-handler.service';

@Module({
  imports: [TranslationModule, LoggerModule, ConfigModule, RmqModule],
  controllers: [TranslationHandlerService],
})
export class TranslationsModule {}
