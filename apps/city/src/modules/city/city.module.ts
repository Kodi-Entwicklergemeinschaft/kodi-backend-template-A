import { Module } from '@nestjs/common';
import { CityController } from './city.controller';
import { CityMessageController } from './city-message.controller';
import { CityService } from './city.service';
import { LoggerModule } from '@kodi/logger';
import { PrismaCityModule } from '@kodi/prisma';
import { StorageModule } from '@kodi/storage';

@Module({
  imports: [LoggerModule, PrismaCityModule, StorageModule],
  controllers: [CityController, CityMessageController],
  providers: [CityService],
})
export class CityModule {}
