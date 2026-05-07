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
import { EmailVerificationStrategy } from './strategies/email-verification.strategy';
import { SmsVerificationStrategy } from './strategies/sms-verification.strategy';
import { IVerificationStrategy } from './strategies/verification-strategy.interface';
import {
  SendVerificationDto,
  VerifyTokenDto,
  ResendVerificationDto,
  CancelVerificationDto,
} from '@kodi/contracts';
import { I18nService } from '@kodi/i18n';

@Injectable()
export class VerificationService {
  private readonly strategies: Map<'EMAIL' | 'SMS', IVerificationStrategy>;
  private readonly TOKEN_EXPIRY_HOURS = 24; // Industry standard: 24 hours
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly prisma: PrismaNotificationService,
    private readonly emailStrategy: EmailVerificationStrategy,
    private readonly smsStrategy: SmsVerificationStrategy,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly logger: LoggerService,
    private readonly i18nService: I18nService,
  ) {
    this.strategies = new Map<'EMAIL' | 'SMS', IVerificationStrategy>([
      ['EMAIL', this.emailStrategy],
      ['SMS', this.smsStrategy],
    ]);
    this.logger.setContext(VerificationService.name);
  }

  /**
   * Send verification link to user (automatically called after registration)
   */
  async sendVerification(dto: SendVerificationDto, language?: string) {
    const initialLanguage = this.resolveLanguage(language, dto.metadata);
    const strategy = this.strategies.get(dto.type);
    if (!strategy) {
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_UNSUPPORTED_TYPE',
        { type: dto.type.toLowerCase() },
        initialLanguage,
      );
      throw new BadRequestException({
        errorCode: 'VERIFICATION_UNSUPPORTED_TYPE',
        message: msg,
      });
    }

    // Validate identifier format
    if (!strategy.validateIdentifier(dto.identifier)) {
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_INVALID_IDENTIFIER',
        { type: dto.type.toLowerCase() },
        initialLanguage,
      );
      throw new BadRequestException({
        errorCode: 'VERIFICATION_INVALID_IDENTIFIER',
        message: msg,
      });
    }

    // Cancel any existing pending verification for this user/identifier
    await this.prisma.verificationToken.updateMany({
      where: {
        userId: dto.userId,
        identifier: dto.identifier,
        type: dto.type,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });

    // Generate secure token
    const token = strategy.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Create verification record
    const mergedMetadata: Record<string, any> = {
      ...(dto.metadata || {}),
    };

    const effectiveLanguage = this.resolveLanguage(initialLanguage, mergedMetadata);
    if (effectiveLanguage && !mergedMetadata.preferredLanguage) {
      mergedMetadata.preferredLanguage = effectiveLanguage;
    }
    if (effectiveLanguage && !mergedMetadata.language) {
      mergedMetadata.language = effectiveLanguage;
    }

    const verificationToken = await this.prisma.verificationToken.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channel: dto.type,
        token,
        identifier: dto.identifier,
        expiresAt,
        maxAttempts: this.MAX_ATTEMPTS,
        status: 'PENDING',
        metadata: mergedMetadata,
      },
    });

    // Send verification via appropriate channel (includes welcome email for EMAIL type)
    await strategy.sendVerification(dto.identifier, token, dto.userId, {
      ...mergedMetadata,
      verificationTokenId: verificationToken.id,
    });

    this.logger.log(`Verification ${dto.type} sent to ${dto.identifier} for user ${dto.userId}`);

    return {
      id: verificationToken.id,
      type: dto.type,
      identifier: dto.identifier,
      expiresAt: verificationToken.expiresAt,
      message: this.i18nService.translate(
        mergedMetadata.isResend
          ? 'success.EMAIL_VERIFICATION_RESENT'
          : 'success.EMAIL_VERIFICATION_SENT',
        undefined,
        effectiveLanguage,
      ),
    };
  }

  /**
   * Verify token from email link
   */
  async verifyToken(dto: VerifyTokenDto, language?: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token: dto.token },
    });

    if (!verificationToken) {
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_TOKEN_INVALID',
        undefined,
        language,
      );
      throw new NotFoundException({
        errorCode: 'VERIFICATION_TOKEN_INVALID',
        message: msg,
      });
    }

    // For verification, prioritize the stored language from registration over browser's Accept-Language
    const metadataLanguage = this.extractLanguageFromMetadata(verificationToken.metadata);
    const storedLanguage = this.getLanguageFromMetadata(metadataLanguage);
    const effectiveLanguage = storedLanguage || language;

    if (verificationToken.isUsed || verificationToken.status === 'VERIFIED') {
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_TOKEN_USED',
        undefined,
        effectiveLanguage,
      );
      throw new BadRequestException({
        errorCode: 'VERIFICATION_TOKEN_USED',
        message: msg,
      });
    }

    if (verificationToken.status === 'CANCELLED') {
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_TOKEN_CANCELLED',
        undefined,
        effectiveLanguage,
      );
      throw new BadRequestException({
        errorCode: 'VERIFICATION_TOKEN_CANCELLED',
        message: msg,
      });
    }

    if (new Date() > verificationToken.expiresAt) {
      await this.prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { status: 'EXPIRED' },
      });
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_TOKEN_EXPIRED',
        undefined,
        effectiveLanguage,
      );
      throw new UnprocessableEntityException({
        errorCode: 'VERIFICATION_TOKEN_EXPIRED',
        message: msg,
      });
    }

    if (verificationToken.attempts >= verificationToken.maxAttempts) {
      await this.prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { status: 'FAILED' },
      });
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_MAX_ATTEMPTS',
        undefined,
        effectiveLanguage,
      );
      throw new UnprocessableEntityException({
        errorCode: 'VERIFICATION_MAX_ATTEMPTS',
        message: msg,
      });
    }

    await this.prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        isUsed: true,
        attempts: { increment: 1 },
      },
    });

    this.client.emit(RabbitMQPatterns.VERIFICATION_VERIFIED, {
      userId: verificationToken.userId,
      type: verificationToken.type,
      identifier: verificationToken.identifier,
      verifiedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Verification ${verificationToken.type} verified for user ${verificationToken.userId}`,
    );

    return {
      verified: true,
      type: verificationToken.type,
      identifier: verificationToken.identifier,
      userId: verificationToken.userId,
      verifiedAt: new Date(),
      message: this.i18nService.translate('success.EMAIL_VERIFIED', undefined, effectiveLanguage),
      language: effectiveLanguage,
    };
  }

  /**
   * Cancel verification (It's not me)
   */
  async cancelVerification(dto: CancelVerificationDto, language?: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token: dto.token },
    });

    if (!verificationToken) {
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_TOKEN_INVALID',
        undefined,
        language,
      );
      throw new NotFoundException({
        errorCode: 'VERIFICATION_TOKEN_INVALID',
        message: msg,
      });
    }

    // For cancellation, prioritize the stored language from registration over browser's Accept-Language
    const metadataLanguage = this.extractLanguageFromMetadata(verificationToken.metadata);
    const storedLanguage = this.getLanguageFromMetadata(metadataLanguage);
    const effectiveLanguage = storedLanguage || language;

    if (verificationToken.status === 'VERIFIED') {
      const msg = this.i18nService.translate(
        'errors.VERIFICATION_CANCEL_VERIFIED',
        undefined,
        effectiveLanguage,
      );
      throw new BadRequestException({
        errorCode: 'VERIFICATION_CANCEL_VERIFIED',
        message: msg,
      });
    }

    if (verificationToken.status === 'CANCELLED') {
      return {
        cancelled: true,
        message: this.i18nService.translate(
          'success.VERIFICATION_ALREADY_CANCELLED',
          undefined,
          effectiveLanguage,
        ),
        language: effectiveLanguage,
      };
    }

    // Mark as cancelled
    await this.prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Emit verification cancelled event
    this.client.emit(RabbitMQPatterns.VERIFICATION_CANCELLED, {
      userId: verificationToken.userId,
      type: verificationToken.type,
      identifier: verificationToken.identifier,
      cancelledAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Verification ${verificationToken.type} cancelled for user ${verificationToken.userId}`,
    );

    return {
      cancelled: true,
      message: this.i18nService.translate(
        'success.VERIFICATION_CANCELLED',
        undefined,
        effectiveLanguage,
      ),
      language: effectiveLanguage,
    };
  }

  /**
   * Resend verification link (if expired, cancelled, or user requests new one)
   * This method will send a new verification email if:
   * - No existing token is found
   * - Existing token is EXPIRED
   * - Existing token is CANCELLED
   * - Existing token is PENDING but expired
   * It will NOT resend if there's a valid (non-expired) PENDING token
   */
  async resendVerification(dto: ResendVerificationDto, language?: string) {
    // Check if there's a recent verification that's expired or cancelled
    // Note: CANCELLED tokens are included so we can explicitly handle them
    const existingToken = await this.prisma.verificationToken.findFirst({
      where: {
        userId: dto.userId,
        type: dto.type,
        identifier: dto.identifier,
        status: { in: ['PENDING', 'EXPIRED', 'CANCELLED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If token is CANCELLED or EXPIRED, allow resend (will send new email)
    // If token is PENDING and not expired, inform user that email was already sent
    if (existingToken && existingToken.status === 'PENDING') {
      const metadataLanguage = this.extractLanguageFromMetadata(existingToken.metadata);
      const effectiveLanguage = this.resolveLanguage(language, metadataLanguage);
      const isExpired = new Date() > existingToken.expiresAt;
      if (!isExpired) {
        const msg = this.i18nService.translate(
          'errors.VERIFICATION_ALREADY_SENT',
          undefined,
          effectiveLanguage,
        );
        throw new BadRequestException({
          errorCode: 'VERIFICATION_ALREADY_SENT',
          message: msg,
        });
      }
    }

    // Send new verification email for:
    // - No existing token found
    // - EXPIRED token
    // - CANCELLED token
    // - PENDING but expired token
    return this.sendVerification(
      {
        userId: dto.userId,
        type: dto.type,
        identifier: dto.identifier,
        metadata: {
          ...dto.metadata,
          isResend: true,
        },
      },
      language,
    );
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string, type: 'EMAIL' | 'SMS') {
    const verification = await this.prisma.verificationToken.findFirst({
      where: {
        userId,
        type,
        status: 'VERIFIED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return { verified: false, status: 'NOT_VERIFIED' };
    }

    return {
      verified: true,
      status: verification.status,
      identifier: verification.identifier,
      verifiedAt: verification.verifiedAt,
    };
  }

  private resolveLanguage(
    explicitLanguage?: string | null,
    metadata?: Record<string, any> | string | null,
  ): string | undefined {
    if (explicitLanguage && explicitLanguage.trim() !== '') {
      return explicitLanguage;
    }

    if (!metadata) {
      return undefined;
    }

    if (typeof metadata === 'string' && metadata.trim() !== '') {
      return metadata;
    }

    if (typeof metadata === 'object') {
      const meta = metadata as Record<string, any>;
      const preferred = meta.preferredLanguage || meta.language || meta.locale;
      if (typeof preferred === 'string' && preferred.trim() !== '') {
        return preferred;
      }
    }

    return undefined;
  }

  private extractLanguageFromMetadata(metadata: unknown): Record<string, any> | string | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    return metadata as Record<string, any>;
  }

  /**
   * Extract language string from metadata object
   */
  private getLanguageFromMetadata(
    metadata: Record<string, any> | string | null,
  ): string | undefined {
    if (!metadata) {
      return undefined;
    }

    if (typeof metadata === 'string' && metadata.trim() !== '') {
      return metadata;
    }

    if (typeof metadata === 'object') {
      const preferred = metadata.preferredLanguage || metadata.language || metadata.locale;
      if (typeof preferred === 'string' && preferred.trim() !== '') {
        return preferred;
      }
    }

    return undefined;
  }
}
