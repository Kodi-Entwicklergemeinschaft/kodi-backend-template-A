import { Module } from '@nestjs/common';
import { CoreController } from './core.controller';
import { CoreMessageController } from './core-message.controller';
import { CoreService } from './core.service';
import { LoggerModule } from '@kodi/logger';
import { PrismaCoreModule } from '@kodi/prisma';
import { TranslationModule } from '@kodi/translations';
import { ConfigModule } from '@kodi/config';

@Module({
  imports: [LoggerModule, PrismaCoreModule, TranslationModule, ConfigModule], // For message controller logging
  controllers: [CoreController, CoreMessageController],
  providers: [CoreService],
})
export class CoreModule {}
