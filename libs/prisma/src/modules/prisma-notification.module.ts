import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule } from '@kodi/config';
import { PrismaNotificationService } from '../services/prisma-notification.service';

@Global()
@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [PrismaNotificationService],
  exports: [PrismaNotificationService],
})
export class PrismaNotificationModule {}
