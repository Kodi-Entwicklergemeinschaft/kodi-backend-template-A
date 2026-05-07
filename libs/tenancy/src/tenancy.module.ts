import { Global, Module } from '@nestjs/common';
import { CityContextService } from './city-context.service';
import { TenancyInterceptor } from './tenancy.interceptor';
import { CityGuard } from './city.guard';

@Global()
@Module({
  providers: [CityContextService, TenancyInterceptor, CityGuard],
  exports: [CityContextService, TenancyInterceptor, CityGuard],
})
export class TenancyModule {}
