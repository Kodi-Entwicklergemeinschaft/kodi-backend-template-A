import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RabbitMQPatterns } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';
import { CityService } from './city.service';

@Controller()
export class CityMessageController {
  private readonly logger: LoggerService;

  constructor(
    private readonly cityService: CityService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(CityMessageController.name);
  }

  @MessagePattern(RabbitMQPatterns.CITY_FIND_BY_ID)
  async handleCityFindById(@Payload() data: { id: string }) {
    this.logger.log(`Received message: ${RabbitMQPatterns.CITY_FIND_BY_ID} for cityId: ${data.id}`);

    try {
      const city = await this.cityService.findOne(data.id);
      return city;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.CITY_FIND_BY_ID} for cityId: ${data.id}`,
        error,
      );
      // Return null if city not found (service will handle default theme)
      return null;
    }
  }

  @MessagePattern(RabbitMQPatterns.CITY_FIND_BY_KEY)
  async handleCityFindByKey(@Payload() data: { key: string }) {
    this.logger.log(`Received message: ${RabbitMQPatterns.CITY_FIND_BY_KEY} for key: ${data.key}`);

    try {
      const city = await this.cityService.findByKey(data.key);
      return city;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.CITY_FIND_BY_KEY} for key: ${data.key}`,
        error,
      );
      return null;
    }
  }
}
