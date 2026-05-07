import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TermsService } from './terms.service';
import { RabbitMQPatterns } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';

@Controller()
export class TermsMessageController {
  private readonly logger: LoggerService;

  constructor(
    private readonly termsService: TermsService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(TermsMessageController.name);
  }

  @MessagePattern(RabbitMQPatterns.TERMS_GET_LATEST)
  async getLatestTerms(@Payload() data: { locale?: string; cityId?: string | null }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.TERMS_GET_LATEST} for locale: ${data.locale || 'default'}, cityId: ${data.cityId || 'general'}`,
    );

    try {
      const terms = await this.termsService.getLatestTerms(data.locale, data.cityId);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.TERMS_GET_LATEST} (will ACK)`,
      );
      return terms;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.TERMS_GET_LATEST} (will NACK)`,
        error,
      );
      throw error;
    }
  }

  @MessagePattern(RabbitMQPatterns.TERMS_CHECK_ACCEPTANCE)
  async checkAcceptance(
    @Payload() data: { userId: string; locale?: string; cityId?: string | null },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.TERMS_CHECK_ACCEPTANCE} for userId: ${data.userId}, cityId: ${data.cityId || 'general'}`,
    );

    try {
      const result = await this.termsService.hasUserAcceptedLatestTerms(
        data.userId,
        data.locale,
        data.cityId,
      );
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.TERMS_CHECK_ACCEPTANCE} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.TERMS_CHECK_ACCEPTANCE} (will NACK)`,
        error,
      );
      throw error;
    }
  }

  @MessagePattern(RabbitMQPatterns.TERMS_GET_USER_VERSION)
  async getUserVersion(@Payload() data: { userId: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.TERMS_GET_USER_VERSION} for userId: ${data.userId}`,
    );

    try {
      const version = await this.termsService.getUserAcceptedVersion(data.userId);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.TERMS_GET_USER_VERSION} (will ACK)`,
      );
      return { version };
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.TERMS_GET_USER_VERSION} (will NACK)`,
        error,
      );
      throw error;
    }
  }
}
