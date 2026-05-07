import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseProjectManager } from './firebase-project-manager.service';
import { LoggerService } from '@kodi/logger';

@Injectable()
export class FCMService {
  private readonly logger: LoggerService;

  constructor(
    private readonly projectManager: FirebaseProjectManager,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(FCMService.name);
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    token: string,
    notification: admin.messaging.Notification,
    data?: { [key: string]: string },
    cityId?: string,
  ): Promise<string> {
    const app = await this.projectManager.getFirebaseApp(cityId);
    const messaging = admin.messaging(app);

    const message: admin.messaging.Message = {
      token,
      notification,
      data,
    };

    try {
      const response = await messaging.send(message);
      this.logger.log(`FCM message sent: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send FCM message`, error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    tokens: string[],
    notification: admin.messaging.Notification,
    data?: { [key: string]: string },
    cityId?: string,
  ): Promise<admin.messaging.BatchResponse> {
    const app = await this.projectManager.getFirebaseApp(cityId);
    const messaging = admin.messaging(app);

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification,
      data,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      this.logger.log(
        `FCM multicast: ${response.successCount} successful, ${response.failureCount} failed`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to send FCM multicast`, error);
      throw error;
    }
  }

  /**
   * Send push notification to a topic
   */
  async sendToTopic(
    topic: string,
    notification: admin.messaging.Notification,
    data?: { [key: string]: string },
    cityId?: string,
  ): Promise<string> {
    const app = await this.projectManager.getFirebaseApp(cityId);
    const messaging = admin.messaging(app);

    const message: admin.messaging.Message = {
      topic,
      notification,
      data,
    };

    try {
      const response = await messaging.send(message);
      this.logger.log(`FCM topic message sent: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send FCM topic message`, error);
      throw error;
    }
  }
}
