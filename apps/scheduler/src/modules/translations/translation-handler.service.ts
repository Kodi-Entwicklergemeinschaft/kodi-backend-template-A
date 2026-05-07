import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TranslationService, RateLimitError } from '@kodi/translations';
import { LoggerService } from '@kodi/logger';
import { ConfigService } from '@kodi/config';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { AutoTranslateFieldDto } from '@kodi/contracts';

@Controller()
export class TranslationHandlerService {
  private readonly logger: LoggerService;
  private readonly maxRequeueAttempts: number;

  constructor(
    private readonly translationService: TranslationService,
    private readonly configService: ConfigService,
    @Inject(RABBITMQ_CLIENT) private readonly rmqClient: RmqClientWrapper,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(TranslationHandlerService.name);
    this.maxRequeueAttempts = parseInt(
      this.configService.get<string>('translations.maxRequeueAttempts', '3'),
      10,
    );
  }

  @EventPattern(RabbitMQPatterns.TRANSLATION_AUTO_TRANSLATE)
  async handleAutoTranslate(@Payload() data: AutoTranslateFieldDto) {
    const requeueAttempts = data.requeueAttempts || 0;

    this.logger.log(
      `Processing auto-translate job: ${data.entityType}/${data.entityId}/${data.field} to ${data.targetLocales.join(', ')} (requeue attempt: ${requeueAttempts})`,
    );

    try {
      await this.translationService.autoTranslate(
        data.entityType,
        data.entityId,
        data.field,
        data.sourceLocale,
        data.targetLocales,
        data.text,
        data.sourceHash,
      );

      this.logger.log(
        `Successfully translated ${data.entityType}/${data.entityId}/${data.field} to ${data.targetLocales.join(', ')}`,
      );
    } catch (error: any) {
      // Handle rate limit errors with requeue
      if (error instanceof RateLimitError) {
        if (requeueAttempts < this.maxRequeueAttempts) {
          const retryAfter = error.retryAfter || 60000; // Default to 60 seconds if not provided
          const delay = Math.min(retryAfter, 300000); // Cap at 5 minutes

          this.logger.warn(
            `Rate limit error for ${data.entityType}/${data.entityId}/${data.field}. Requeuing after ${Math.round(delay / 1000)}s (attempt ${requeueAttempts + 1}/${this.maxRequeueAttempts})`,
          );

          // Requeue with delay
          setTimeout(() => {
            try {
              this.rmqClient.emit(RabbitMQPatterns.TRANSLATION_AUTO_TRANSLATE, {
                ...data,
                requeueAttempts: requeueAttempts + 1,
              });
              this.logger.log(
                `Requeued translation job for ${data.entityType}/${data.entityId}/${data.field}`,
              );
            } catch (requeueError) {
              this.logger.error(
                `Failed to requeue translation job for ${data.entityType}/${data.entityId}/${data.field}`,
                requeueError,
              );
            }
          }, delay);

          // Acknowledge the message (we've requeued it)
          return;
        } else {
          this.logger.error(
            `Rate limit error for ${data.entityType}/${data.entityId}/${data.field} exceeded max requeue attempts (${this.maxRequeueAttempts}). Giving up.`,
            error,
          );
          // Acknowledge the message (we've given up)
          return;
        }
      }

      // For non-rate-limit errors, log and acknowledge
      this.logger.error(
        `Failed to auto-translate ${data.entityType}/${data.entityId}/${data.field}: ${error?.message}`,
        error,
      );
      // Don't throw - allow message to be acknowledged even on failure
      // The translation service will log the error
    }
  }
}
