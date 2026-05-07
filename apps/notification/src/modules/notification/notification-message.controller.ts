import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';
import { PrismaNotificationService } from '@kodi/prisma';
import { EmailService } from './email.service';
import { FCMPushService } from '../fcm/fcm-push.service';
import { SendNotificationDto, SendTopicNotificationDto } from '@kodi/contracts';
import { firstValueFrom, timeout } from 'rxjs';

@Controller()
export class NotificationMessageController {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaNotificationService,
    private readonly emailService: EmailService,
    private readonly fcmPushService: FCMPushService,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(NotificationMessageController.name);
  }

  @MessagePattern(RabbitMQPatterns.NOTIFICATION_SEND)
  async handleNotificationSend(
    @Payload()
    data: {
      notificationId?: string; // Optional - will be created if not provided
      userId: string;
      type: string;
      channel: string;
      subject?: string;
      content: string;
      metadata?: any;
      translationKey?: string;
      translationParams?: Record<string, any>;
      cityId?: string;
      fcmData?: { [key: string]: string };
    },
  ) {
    // If notificationId is not provided, create a notification record first
    let notificationId = data.notificationId;
    if (!notificationId) {
      try {
        // Extract scheduleRunId from metadata if present
        const scheduleRunId = data.metadata?.scheduleRunId || null;
        // Remove scheduleRunId from metadata to avoid duplication
        const metadataWithoutScheduleRunId = { ...(data.metadata || {}) };
        if (metadataWithoutScheduleRunId.scheduleRunId) {
          delete metadataWithoutScheduleRunId.scheduleRunId;
        }

        const notification = await this.prisma.notification.create({
          data: {
            userId: data.userId,
            type: data.type as any, // Type casting for Prisma enum
            channel: data.channel as any, // Type casting for Prisma enum
            subject: data.subject,
            content: data.content,
            metadata: metadataWithoutScheduleRunId,
            scheduleRunId: scheduleRunId,
            status: 'PENDING',
          },
        });
        notificationId = notification.id;
        this.logger.log(
          `Created notification record: ${notificationId} for message: ${RabbitMQPatterns.NOTIFICATION_SEND}${scheduleRunId ? ` (scheduleRunId: ${scheduleRunId})` : ''}`,
        );
      } catch (error) {
        this.logger.error(`Failed to create notification record`, error);
        throw error;
      }
    }

    this.logger.log(
      `Received message: ${RabbitMQPatterns.NOTIFICATION_SEND} for notificationId: ${notificationId}`,
    );

    try {
      // Route by channel
      if (data.channel === 'EMAIL') {
        await this.handleEmailNotification({ ...data, notificationId });
      } else if (data.channel === 'PUSH') {
        await this.handlePushNotification({
          ...data,
          notificationId,
          translationKey: data.translationKey,
          translationParams: data.translationParams,
          cityId: data.cityId,
          fcmData: data.fcmData,
        });
      } else if (data.channel === 'SMS') {
        // SMS implementation can be added later
        this.logger.warn(`SMS channel not yet implemented for notification ${notificationId}`);
        await this.updateNotificationStatus(
          notificationId,
          'FAILED',
          'SMS channel not implemented',
        );
        this.client.emit(RabbitMQPatterns.NOTIFICATION_FAILED, {
          notificationId: notificationId,
          reason: 'SMS channel not implemented',
          timestamp: new Date().toISOString(),
        });
      } else {
        this.logger.warn(`Unsupported channel: ${data.channel} for notification ${notificationId}`);
        await this.updateNotificationStatus(
          notificationId,
          'FAILED',
          `Unsupported channel: ${data.channel}`,
        );
        this.client.emit(RabbitMQPatterns.NOTIFICATION_FAILED, {
          notificationId: notificationId,
          reason: `Unsupported channel: ${data.channel}`,
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true, message: 'Notification processed', notificationId };
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.NOTIFICATION_SEND} for notificationId: ${notificationId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.NOTIFICATION_SEND_TOPIC)
  async handleNotificationSendTopic(
    @Payload() data: SendTopicNotificationDto,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.NOTIFICATION_SEND_TOPIC} — topic: ${data.topic}`,
    );
    try {
      await this.fcmPushService.sendToTopic(data);
      this.logger.log(`Topic notification sent to: ${data.topic}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error sending topic notification to '${data.topic}' (will NACK)`, error);
      throw error; // NestJS NACKs on throw
    }
  }

  /**
   * Handle push notification delivery
   */
  private async handlePushNotification(data: {
    notificationId: string;
    userId: string;
    type: string;
    subject?: string;
    content: string;
    metadata?: any;
    translationKey?: string;
    translationParams?: Record<string, any>;
    cityId?: string;
    fcmData?: { [key: string]: string };
  }): Promise<void> {
    try {
      // Build SendNotificationDto from data
      const dto: SendNotificationDto = {
        userId: data.userId,
        type: data.type as any,
        channel: 'PUSH',
        subject: data.subject,
        content: data.content,
        cityId: data.cityId || data.metadata?.cityId,
        fcmData: data.fcmData || data.metadata?.fcmData,
        translationKey: data.translationKey || data.metadata?.translationKey,
        translationParams: data.translationParams || data.metadata?.translationParams,
        metadata: data.metadata,
      };

      // Send push notification with translation support
      // Language is resolved from user.preferredLanguage in FCMTranslationService
      await this.fcmPushService.sendPushNotification(dto);

      // Update notification status to SENT
      await this.updateNotificationStatus(data.notificationId, 'SENT');

      // Emit NOTIFICATION_SENT event
      this.client.emit(RabbitMQPatterns.NOTIFICATION_SENT, {
        notificationId: data.notificationId,
        userId: data.userId,
        channel: 'PUSH',
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Push notification sent successfully: ${data.notificationId}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${data.notificationId}`, error);

      // Update notification status to FAILED
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.updateNotificationStatus(data.notificationId, 'FAILED', errorMessage);

      // Emit NOTIFICATION_FAILED event
      this.client.emit(RabbitMQPatterns.NOTIFICATION_FAILED, {
        notificationId: data.notificationId,
        userId: data.userId,
        channel: 'PUSH',
        reason: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Handle email notification delivery
   */
  private async handleEmailNotification(data: {
    notificationId: string;
    userId: string;
    subject?: string;
    content: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Extract recipient email from metadata or fetch from users service
      let recipientEmail = data.metadata?.recipientEmail;

      if (!recipientEmail) {
        // Fetch user email via RabbitMQ
        const user = await firstValueFrom(
          this.client
            .send<any, { id: string }>(RabbitMQPatterns.USER_FIND_BY_ID, { id: data.userId })
            .pipe(timeout(10000)),
        );

        if (!user || !user.email) {
          throw new Error(`User ${data.userId} not found or has no email`);
        }

        recipientEmail = user.email;
      }

      // Send email
      await this.emailService.sendVerificationEmail(
        recipientEmail,
        data.subject || 'Notification',
        data.content,
      );

      // Update notification status to SENT
      await this.updateNotificationStatus(data.notificationId, 'SENT');

      // Emit NOTIFICATION_SENT event
      this.client.emit(RabbitMQPatterns.NOTIFICATION_SENT, {
        notificationId: data.notificationId,
        userId: data.userId,
        channel: 'EMAIL',
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Email notification sent successfully: ${data.notificationId}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${data.notificationId}`, error);

      // Update notification status to FAILED
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.updateNotificationStatus(data.notificationId, 'FAILED', errorMessage);

      // Emit NOTIFICATION_FAILED event
      this.client.emit(RabbitMQPatterns.NOTIFICATION_FAILED, {
        notificationId: data.notificationId,
        userId: data.userId,
        channel: 'EMAIL',
        reason: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Update notification status in database
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: 'SENT' | 'FAILED',
    failureReason?: string,
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        sentAt: status === 'SENT' ? new Date() : undefined,
      };

      // If there's a failure reason, preserve existing metadata and add failure reason
      if (failureReason) {
        const existingNotification = await this.prisma.notification.findUnique({
          where: { id: notificationId },
          select: { metadata: true },
        });

        const existingMetadata = existingNotification?.metadata;
        const metadataObject =
          existingMetadata &&
          typeof existingMetadata === 'object' &&
          !Array.isArray(existingMetadata)
            ? (existingMetadata as Record<string, any>)
            : {};

        updateData.metadata = {
          ...metadataObject,
          failureReason,
        };
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(`Failed to update notification status: ${notificationId}`, error);
      // Don't throw - status update failure shouldn't break the flow
    }
  }
}
