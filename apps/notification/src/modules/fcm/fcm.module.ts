import { Module } from '@nestjs/common';
import { FCMService } from './fcm.service';
import { FirebaseProjectManager } from './firebase-project-manager.service';
import { FCMPushService } from './fcm-push.service';
import { FCMTranslationService } from './fcm-translation.service';

@Module({
  providers: [FCMService, FirebaseProjectManager, FCMPushService, FCMTranslationService],
  exports: [FCMService, FirebaseProjectManager, FCMPushService, FCMTranslationService],
})
export class FCMModule {}
