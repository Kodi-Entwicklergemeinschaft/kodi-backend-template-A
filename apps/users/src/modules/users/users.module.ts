import { Module } from '@nestjs/common';
import {
  UsersAdminController,
  UsersAuthController,
  UsersProfileController,
  UsersDevicesController,
  UsersTopicsController,
  UsersPreferencesController,
  UsersPublicController,
} from './controllers';
import { UsersMessageController } from './users-message.controller';
import { UsersService } from './users.service';
import { RBACModule } from '@kodi/rbac';
import { SagaModule } from '@kodi/saga';
import { LoggerModule } from '@kodi/logger';
import { StorageModule } from '@kodi/storage';
import { TermsModule } from '../terms/terms.module';

@Module({
  imports: [
    RBACModule, // For PermissionService
    SagaModule, // Saga orchestrator for distributed transactions
    LoggerModule, // For message controller logging
    StorageModule, // For file uploads
    TermsModule, // Terms of use module
  ],
  controllers: [
    UsersPublicController,
    UsersAdminController,
    UsersAuthController,
    UsersProfileController,
    UsersDevicesController,
    UsersTopicsController,
    UsersPreferencesController,
    UsersMessageController,
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
