import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryQuickFiltersService } from './category-quick-filters.service';
import { SubServicesService } from './sub-services.service';
import { PrismaCoreModule, PrismaCityModule } from '@kodi/prisma';
import { StorageModule } from '@kodi/storage';
import { I18nModule } from '@kodi/i18n';
import { ConfigModule } from '@kodi/config';
import { FiltersModule } from '../filters/filters.module';

@Module({
  imports: [
    PrismaCoreModule,
    PrismaCityModule,
    StorageModule,
    I18nModule,
    ConfigModule,
    FiltersModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoryQuickFiltersService, SubServicesService],
  exports: [CategoriesService, CategoryQuickFiltersService, SubServicesService],
})
export class CategoriesModule {}
