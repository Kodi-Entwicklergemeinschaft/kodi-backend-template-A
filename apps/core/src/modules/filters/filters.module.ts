import { Module } from '@nestjs/common';
import { FiltersController } from './filters.controller';
import { FiltersService } from './filters.service';
import { LoggerModule } from '@kodi/logger';
import { PrismaCoreModule } from '@kodi/prisma';
import { TranslationModule } from '@kodi/translations';

@Module({
  imports: [LoggerModule, PrismaCoreModule, TranslationModule],
  controllers: [FiltersController],
  providers: [FiltersService],
  exports: [FiltersService],
})
export class FiltersModule {}
