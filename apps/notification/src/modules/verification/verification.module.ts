import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationMessageController } from './verification-message.controller';
import { VerificationService } from './verification.service';
import { EmailVerificationStrategy } from './strategies/email-verification.strategy';
import { SmsVerificationStrategy } from './strategies/sms-verification.strategy';
import { CityEmailThemeService } from './services/city-email-theme.service';

@Module({
  controllers: [VerificationController, VerificationMessageController],
  providers: [
    VerificationService,
    EmailVerificationStrategy,
    SmsVerificationStrategy,
    CityEmailThemeService,
  ],
  exports: [VerificationService, CityEmailThemeService],
})
export class VerificationModule {}
