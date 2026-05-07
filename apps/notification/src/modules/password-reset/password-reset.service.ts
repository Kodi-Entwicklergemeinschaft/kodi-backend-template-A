import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
  Inject,
} from '@nestjs/common';
import { PrismaNotificationService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { EmailPasswordResetStrategy } from './strategies/email-password-reset.strategy';
import { I18nService } from '@kodi/i18n';
import { ConfigService } from '@kodi/config';

@Injectable()
export class PasswordResetService {
  private readonly TOKEN_EXPIRY_HOURS: number;
  private readonly MAX_ATTEMPTS: number;

  constructor(
    private readonly prisma: PrismaNotificationService,
    private readonly emailStrategy: EmailPasswordResetStrategy,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly logger: LoggerService,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(PasswordResetService.name);
    // Read from config with defaults
    this.TOKEN_EXPIRY_HOURS = this.configService.passwordResetExpiryHours;
    this.MAX_ATTEMPTS = this.configService.passwordResetMaxAttempts;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, userId: string, metadata?: Record<string, any>) {
    // Cancel any existing pending reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId,
        email,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });

    // Generate secure token
    const token = this.emailStrategy.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Create password reset token record
    const resetToken = await this.prisma.passwordResetToken.create({
      data: {
        userId,
        email,
        token,
        expiresAt,
        maxAttempts: this.MAX_ATTEMPTS,
        status: 'PENDING',
        metadata: metadata || {},
      },
    });

    // Send password reset email with expiry hours
    await this.emailStrategy.sendPasswordResetEmail(email, token, userId, {
      ...metadata,
      resetTokenId: resetToken.id,
      expiryHours: this.TOKEN_EXPIRY_HOURS,
    });

    // Emit password reset sent event
    this.client.emit(RabbitMQPatterns.PASSWORD_RESET_SENT, {
      userId,
      email,
      resetTokenId: resetToken.id,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Password reset email sent to ${email} for user ${userId}`);

    return {
      id: resetToken.id,
      email,
      expiresAt: resetToken.expiresAt,
      message:
        this.i18nService.translate(
          'success.PASSWORD_RESET_EMAIL_SENT',
          undefined,
          metadata?.preferredLanguage,
        ) || 'Password reset email sent',
    };
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(token: string, language?: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      const msg =
        this.i18nService.translate('errors.PASSWORD_RESET_TOKEN_INVALID', undefined, language) ||
        'Invalid password reset token';
      throw new NotFoundException({
        errorCode: 'PASSWORD_RESET_TOKEN_INVALID',
        message: msg,
      });
    }

    if (resetToken.isUsed || resetToken.status === 'USED') {
      const msg =
        this.i18nService.translate('errors.PASSWORD_RESET_TOKEN_USED', undefined, language) ||
        'Password reset token has already been used';
      throw new BadRequestException({
        errorCode: 'PASSWORD_RESET_TOKEN_USED',
        message: msg,
      });
    }

    if (resetToken.status === 'CANCELLED') {
      const msg =
        this.i18nService.translate('errors.PASSWORD_RESET_TOKEN_CANCELLED', undefined, language) ||
        'Password reset token has been cancelled';
      throw new BadRequestException({
        errorCode: 'PASSWORD_RESET_TOKEN_CANCELLED',
        message: msg,
      });
    }

    if (new Date() > resetToken.expiresAt) {
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { status: 'EXPIRED' },
      });
      const msg =
        this.i18nService.translate('errors.PASSWORD_RESET_TOKEN_EXPIRED', undefined, language) ||
        'Password reset link has expired';
      throw new UnprocessableEntityException({
        errorCode: 'PASSWORD_RESET_TOKEN_EXPIRED',
        message: msg,
      });
    }

    if (resetToken.attempts >= resetToken.maxAttempts) {
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { status: 'FAILED' },
      });
      const msg =
        this.i18nService.translate('errors.PASSWORD_RESET_MAX_ATTEMPTS', undefined, language) ||
        'Maximum password reset attempts exceeded';
      throw new UnprocessableEntityException({
        errorCode: 'PASSWORD_RESET_MAX_ATTEMPTS',
        message: msg,
      });
    }

    return {
      valid: true,
      userId: resetToken.userId,
      email: resetToken.email,
      resetTokenId: resetToken.id,
    };
  }

  /**
   * Mark password reset token as used
   */
  async markTokenAsUsed(token: string) {
    await this.prisma.passwordResetToken.update({
      where: { token },
      data: {
        status: 'USED',
        usedAt: new Date(),
        isUsed: true,
        attempts: { increment: 1 },
      },
    });
  }
}
