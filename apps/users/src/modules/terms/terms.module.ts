import { Module } from '@nestjs/common';
import { TermsController } from './terms.controller';
import { TermsMessageController } from './terms-message.controller';
import { TermsService } from './terms.service';
import { PrismaUsersModule } from '@kodi/prisma';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule } from '@kodi/config';

@Module({
  imports: [PrismaUsersModule, LoggerModule, ConfigModule],
  controllers: [TermsController, TermsMessageController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}
