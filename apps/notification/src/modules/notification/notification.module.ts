import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationMessageController } from './notification-message.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { FCMModule } from '../fcm/fcm.module';

@Module({
  imports: [FCMModule],
  controllers: [NotificationController, NotificationMessageController],
  providers: [NotificationService, EmailService],
  exports: [EmailService],
})
export class NotificationModule {}
