import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@kodi/config';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
