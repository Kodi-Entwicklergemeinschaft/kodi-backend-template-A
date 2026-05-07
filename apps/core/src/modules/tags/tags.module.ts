import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { LoggerModule } from '@kodi/logger';
import { PrismaCoreModule } from '@kodi/prisma';

@Module({
  imports: [LoggerModule, PrismaCoreModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
