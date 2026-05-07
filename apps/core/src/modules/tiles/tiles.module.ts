import { Module } from '@nestjs/common';
import { TilesController } from './tiles.controller';
import { TilesService } from './tiles.service';
import { LoggerModule } from '@kodi/logger';
import { PrismaCoreModule } from '@kodi/prisma';
import { RBACModule } from '@kodi/rbac';
import { StorageModule } from '@kodi/storage';

@Module({
  imports: [LoggerModule, PrismaCoreModule, RBACModule, StorageModule],
  controllers: [TilesController],
  providers: [TilesService],
  exports: [TilesService],
})
export class TilesModule {}
