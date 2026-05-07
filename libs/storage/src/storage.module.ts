import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@kodi/logger';
import { ConfigModule } from '@kodi/config';
import { StorageService } from './storage.service';
import { FileUploadService } from './file-upload.service';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [StorageService, FileUploadService],
  exports: [StorageService, FileUploadService],
})
export class StorageModule {}
