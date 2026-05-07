import { Injectable, Inject } from '@nestjs/common';
import { IVerificationStrategy } from './verification-strategy.interface';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';

@Injectable()
export class SmsVerificationStrategy implements IVerificationStrategy {
  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(SmsVerificationStrategy.name);
  }

  generateToken(): string {
    // Generate 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  validateIdentifier(identifier: string): boolean {
    // Basic phone number validation (can be enhanced)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(identifier);
  }

  async sendVerification(
    identifier: string,
    token: string,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Use notification service to send SMS
    await this.client.emit(RabbitMQPatterns.NOTIFICATION_SEND, {
      userId,
      type: 'INFO',
      channel: 'SMS',
      subject: null,
      content: `Your verification code is: ${token}. This code will expire in 24 hours.`,
      metadata: {
        ...metadata,
        verificationType: 'SMS_VERIFICATION',
        verificationCode: token,
        phoneNumber: identifier,
      },
    });

    this.logger.log(`SMS verification sent to ${identifier} for user ${userId}`);
  }

  getType(): 'SMS' {
    return 'SMS';
  }
}
