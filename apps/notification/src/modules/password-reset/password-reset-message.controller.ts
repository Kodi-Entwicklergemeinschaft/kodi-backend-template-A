import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PasswordResetService } from './password-reset.service';
import { RabbitMQPatterns } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';

@Controller()
export class PasswordResetMessageController {
  private readonly logger: LoggerService;

  constructor(
    private readonly passwordResetService: PasswordResetService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(PasswordResetMessageController.name);
  }

  @EventPattern(RabbitMQPatterns.PASSWORD_RESET_REQUESTED)
  async handlePasswordResetRequested(
    @Payload()
    data: {
      userId: string;
      email: string;
      metadata?: Record<string, any>;
    },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.PASSWORD_RESET_REQUESTED} for userId: ${data.userId}`,
    );

    try {
      await this.passwordResetService.sendPasswordResetEmail(
        data.email,
        data.userId,
        data.metadata,
      );

      this.logger.log(`Password reset email sent to ${data.email} for user ${data.userId}`);

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.PASSWORD_RESET_REQUESTED} for userId: ${data.userId}`,
        error,
      );
      throw error;
    }
  }

  @MessagePattern(RabbitMQPatterns.PASSWORD_RESET_VERIFY)
  async handleVerifyToken(@Payload() data: { token: string }) {
    return this.passwordResetService.verifyResetToken(data.token);
  }

  @EventPattern(RabbitMQPatterns.PASSWORD_RESET_MARK_USED)
  async handleMarkTokenAsUsed(@Payload() data: { token: string }) {
    await this.passwordResetService.markTokenAsUsed(data.token);
  }
}
