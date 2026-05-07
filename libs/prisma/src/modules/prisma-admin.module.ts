import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule } from '@kodi/config';
import { PrismaAdminService } from '../services/prisma-admin.service';

@Global()
@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [PrismaAdminService],
  exports: [PrismaAdminService],
})
export class PrismaAdminModule {}
