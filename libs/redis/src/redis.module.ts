import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule } from '@kodi/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
