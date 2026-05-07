import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingsService } from './listings.service';
import { LoggerModule } from '@kodi/logger';
import { FavoritesController } from './favorites.controller';
import { PrismaCoreModule } from '@kodi/prisma';
import { StorageModule } from '@kodi/storage';

@Module({
  imports: [LoggerModule, PrismaCoreModule, StorageModule],
  controllers: [ListingController, FavoritesController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
