import { Module } from '@nestjs/common';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetMessageController } from './password-reset-message.controller';
import { PasswordResetService } from './password-reset.service';
import { EmailPasswordResetStrategy } from './strategies/email-password-reset.strategy';
import { CityEmailThemeService } from '../verification/services/city-email-theme.service';

@Module({
  controllers: [PasswordResetController, PasswordResetMessageController],
  providers: [PasswordResetService, EmailPasswordResetStrategy, CityEmailThemeService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
