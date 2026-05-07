import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@kodi/config';
import { RedisModule } from '@kodi/redis';
import { HealthCheckService } from './health-check.service';

@Global()
@Module({
  imports: [ConfigModule, RedisModule],
  providers: [HealthCheckService],
  exports: [HealthCheckService],
})
export class HealthModule {}
