import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { CoreService } from './core.service';
import { RabbitMQPatterns } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';

@Controller()
export class CoreMessageController {
  private readonly logger: LoggerService;

  constructor(
    private readonly coreService: CoreService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(CoreMessageController.name);
  }

  @MessagePattern(RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS)
  async getUserAssignments(@Payload() data: { userId: string; role?: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS} for userId: ${data.userId}`,
    );

    try {
      const result = await this.coreService.getUserAssignments(data.userId, data.role);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS} for userId: ${data.userId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.CORE_GET_USER_CITIES)
  async getUserCities(@Payload() data: { userId: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.CORE_GET_USER_CITIES} for userId: ${data.userId}`,
    );

    try {
      const result = await this.coreService.getUserCities(data.userId);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.CORE_GET_USER_CITIES} for userId: ${data.userId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.CORE_GET_USER_CITIES} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.CORE_CREATE_USER_CITY_ASSIGNMENT)
  async createUserCityAssignment(
    @Payload() data: { userId: string; cityId: string; role: string },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.CORE_CREATE_USER_CITY_ASSIGNMENT} for userId: ${data.userId}, cityId: ${data.cityId}`,
    );

    try {
      const result = await this.coreService.createUserCityAssignment(
        data.userId,
        data.cityId,
        data.role,
      );
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.CORE_CREATE_USER_CITY_ASSIGNMENT} for userId: ${data.userId}, cityId: ${data.cityId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.CORE_CREATE_USER_CITY_ASSIGNMENT} for userId: ${data.userId}, cityId: ${data.cityId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.CORE_ASSIGN_CITY_ADMIN)
  async assignCityAdmin(
    @Payload()
    data: {
      userId: string;
      cityId: string;
      role: string | number;
      assignedBy: string;
      canGrantManageAdmins: boolean;
      canManageAdmins?: boolean;
    },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.CORE_ASSIGN_CITY_ADMIN} for userId: ${data.userId}, cityId: ${data.cityId}, role: ${data.role}, assignedBy: ${data.assignedBy}`,
    );

    try {
      const result = await this.coreService.assignCityAdmin(
        data.userId,
        data.cityId,
        data.role,
        data.assignedBy,
        data.canManageAdmins,
      );
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.CORE_ASSIGN_CITY_ADMIN} for userId: ${data.userId}, cityId: ${data.cityId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.CORE_ASSIGN_CITY_ADMIN} for userId: ${data.userId}, cityId: ${data.cityId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.LISTING_FAVORITE_REMINDERS_RUN)
  async handleFavoriteRemindersRun(
    @Payload() data: { taskId?: string; scheduleRunId?: string; triggeredAt?: string },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.LISTING_FAVORITE_REMINDERS_RUN} for taskId: ${data.taskId || 'N/A'}, scheduleRunId: ${data.scheduleRunId || 'N/A'}`,
    );

    try {
      const result = await this.coreService.processFavoriteEventReminders(
        data.triggeredAt,
        data.scheduleRunId,
      );
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.LISTING_FAVORITE_REMINDERS_RUN} - sent ${result.sent24h} 24h reminders, ${result.sent2h} 2h reminders (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.LISTING_FAVORITE_REMINDERS_RUN} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @EventPattern(RabbitMQPatterns.USER_DELETED)
  async handleUserDeleted(
    @Payload() data: { userId: string; email?: string; permanent?: boolean; timestamp: string },
  ) {
    this.logger.log(
      `Received event: ${RabbitMQPatterns.USER_DELETED} for userId: ${data.userId}, permanent: ${data.permanent}`,
    );

    // Only clean up data for permanent deletions
    if (!data.permanent) {
      this.logger.log(`Skipping cleanup for userId: ${data.userId} - not a permanent deletion`);
      return;
    }

    try {
      await this.coreService.cleanupUserData(data.userId);
      this.logger.log(`User data cleanup completed for userId: ${data.userId}`);
    } catch (error) {
      this.logger.error(`Failed to clean up user data for userId: ${data.userId}`, error);
    }
  }

  @MessagePattern(RabbitMQPatterns.LISTING_EXPIRE_CLEANUP)
  async handleExpireEventsCleanup(
    @Payload() data: { taskId?: string; scheduleRunId?: string; triggeredAt?: string },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.LISTING_EXPIRE_CLEANUP} — taskId: ${data.taskId ?? 'N/A'}, scheduleRunId: ${data.scheduleRunId ?? 'N/A'}`,
    );

    try {
      const result = await this.coreService.cleanupExpiredEventListings();
      this.logger.log(
        `Expire events cleanup complete (will ACK) — deleted: ${result.deleted}, skipped: ${result.skipped}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.LISTING_EXPIRE_CLEANUP} (will NACK)`,
        error,
      );
      throw error; // NACK → scheduler logs failure
    }
  }
}
