import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule } from '@kodi/config';
import { PrismaTerminalService } from '../services/prisma-terminal.service';

@Global()
@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [PrismaTerminalService],
  exports: [PrismaTerminalService],
})
export class PrismaTerminalModule {}
