import { Injectable, Inject } from '@nestjs/common';
import { FCMService } from './fcm.service';
import { FCMTranslationService } from './fcm-translation.service';
import { LoggerService } from '@kodi/logger';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { SendNotificationDto, SendTopicNotificationDto } from '@kodi/contracts';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class FCMPushService {
  private readonly logger: LoggerService;

  constructor(
    private readonly fcmService: FCMService,
    private readonly translationService: FCMTranslationService,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(FCMPushService.name);
  }

  /**
   * Send push notification to user
   * Fetches user's FCM tokens from UserDevice table and city from users service
   * Supports multi-language notifications with translation
   */
  async sendPushNotification(dto: SendNotificationDto): Promise<void> {
    try {
      // Fetch user data including city and preferred language
      const user = await firstValueFrom(
        this.client
          .send<any, { id: string }>(RabbitMQPatterns.USER_FIND_BY_ID, { id: dto.userId })
          .pipe(timeout(10000)),
      );

      if (!user) {
        throw new Error(`User ${dto.userId} not found`);
      }

      // Get user's active FCM tokens from UserDevice table
      let devices: any[] = [];
      try {
        devices = await firstValueFrom(
          this.client
            .send<any[], { userId: string }>(RabbitMQPatterns.USER_GET_DEVICES, {
              userId: dto.userId,
            })
            .pipe(timeout(10000)),
        );
      } catch (error) {
        this.logger.warn(
          `Failed to fetch devices for user ${dto.userId}, falling back to legacy method`,
          error,
        );
        // Fallback to legacy method if UserDevice query fails
        devices = this.extractFCMTokensLegacy(user);
      }

      // Extract FCM tokens from devices
      const fcmTokens = devices
        .map((device) => device.fcmToken || device.token)
        .filter((token) => token && token.length > 0);

      this.logger.debug(
        `Found ${devices.length} device(s) with ${fcmTokens.length} FCM token(s) for user ${dto.userId}`,
      );

      if (!fcmTokens || fcmTokens.length === 0) {
        this.logger.warn(
          `No FCM tokens found for user ${dto.userId} - notification will not be delivered. User needs to register device with FCM token.`,
        );
        // Throw error so notification is marked as FAILED instead of SUCCESS
        throw new Error(`No FCM tokens found for user ${dto.userId}`);
      }

      // Log truncated tokens for debugging (first/last 10 chars)
      fcmTokens.forEach((token, index) => {
        const truncated = token.length > 20 ? `${token.slice(0, 10)}...${token.slice(-10)}` : token;
        this.logger.debug(`FCM token ${index + 1}: ${truncated}`);
      });

      // Determine cityId - use provided, user's city, or null (default)
      const targetCityId = dto.cityId || user.cityId || null;

      // Get translated notification content
      const notification = await this.translationService.getNotificationContent(dto, user);

      // Send notification and handle invalid tokens
      const invalidTokens: string[] = [];
      if (fcmTokens.length === 1) {
        try {
          await this.fcmService.sendToDevice(fcmTokens[0], notification, dto.fcmData, targetCityId);
        } catch (error: any) {
          // Check if error indicates invalid token
          if (this.isInvalidTokenError(error)) {
            invalidTokens.push(fcmTokens[0]);
          } else {
            throw error;
          }
        }
      } else {
        try {
          const results = await this.fcmService.sendToMultipleDevices(
            fcmTokens,
            notification,
            dto.fcmData,
            targetCityId,
          );
          // Extract invalid tokens from batch response
          if (results.responses) {
            results.responses.forEach((response, index) => {
              if (response.error && this.isInvalidTokenError(response.error)) {
                invalidTokens.push(fcmTokens[index]);
              }
            });
          }
        } catch (error: any) {
          // If batch send fails completely, log but don't throw
          this.logger.error(`Failed to send batch notification to user ${dto.userId}`, error);
        }
      }

      // Deactivate invalid tokens
      if (invalidTokens.length > 0) {
        await this.deactivateInvalidTokens(dto.userId, invalidTokens);
      }

      this.logger.log(`Push notification sent to user ${dto.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${dto.userId}`, error);
      throw error;
    }
  }

  /**
   * Send a broadcast push notification to an FCM topic.
   * All devices subscribed to the topic receive the notification,
   * regardless of login state (guest or authenticated).
   */
  async sendToTopic(dto: SendTopicNotificationDto): Promise<void> {
    try {
      const messageId = await this.fcmService.sendToTopic(
        dto.topic,
        { title: dto.title, body: dto.body },
        dto.fcmData ?? {},
        dto.cityId,
      );
      this.logger.log(`Topic notification sent to '${dto.topic}' (messageId: ${messageId})`);
    } catch (error) {
      this.logger.error(`Failed to send topic notification to '${dto.topic}'`, error);
      throw error;
    }
  }

  /**
   * Extract FCM tokens from user object (legacy method)
   * Tokens might be stored in metadata, device info, or separate tokens table
   * Used as fallback if UserDevice query fails
   */
  private extractFCMTokensLegacy(user: any): any[] {
    const devices: any[] = [];

    // Check metadata for FCM tokens
    if (user.metadata?.fcmTokens && Array.isArray(user.metadata.fcmTokens)) {
      for (const token of user.metadata.fcmTokens) {
        devices.push({ fcmToken: token });
      }
    }

    // Check device info (if tokens are stored per device)
    // Only include active devices (isActive: true or isActive not set for backwards compatibility)
    if (user.devices && Array.isArray(user.devices)) {
      const activeDevices = user.devices.filter(
        (device: any) => device.isActive === true || device.isActive === undefined,
      );
      devices.push(...activeDevices);
    }

    return devices;
  }

  /**
   * Check if FCM error indicates an invalid token
   */
  private isInvalidTokenError(error: any): boolean {
    // FCM returns specific error codes for invalid tokens
    // Common codes: 'messaging/invalid-registration-token', 'messaging/registration-token-not-registered'
    const errorMessage = error?.message || error?.code || String(error || '');
    return (
      errorMessage.includes('invalid-registration-token') ||
      errorMessage.includes('registration-token-not-registered') ||
      errorMessage.includes('INVALID_REGISTRATION_TOKEN') ||
      errorMessage.includes('REGISTRATION_TOKEN_NOT_REGISTERED')
    );
  }

  /**
   * Deactivate invalid FCM tokens in UserDevice table
   */
  private async deactivateInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
    try {
      for (const token of invalidTokens) {
        // Find device by token and deactivate it
        // Note: We can't directly update via RabbitMQ, so we'll log and let the client handle it
        // Or we could add a new RabbitMQ pattern for deactivating by token
        this.logger.warn(
          `Invalid FCM token detected for user ${userId}: ${token.substring(0, 20)}... (device should be deactivated)`,
        );
        // TODO: Add RabbitMQ pattern USER_DEACTIVATE_DEVICE_BY_TOKEN if needed
        // For now, the client should handle token refresh and re-registration
      }
    } catch (error) {
      this.logger.error(`Failed to deactivate invalid tokens for user ${userId}`, error);
      // Don't throw - token deactivation failure shouldn't break notification flow
    }
  }
}
