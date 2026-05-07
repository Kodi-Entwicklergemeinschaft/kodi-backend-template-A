import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule } from '@kodi/config';
import { PrismaUsersService } from '../services/prisma-users.service';

@Global()
@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [PrismaUsersService],
  exports: [PrismaUsersService],
})
export class PrismaUsersModule {}
