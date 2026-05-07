import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { RabbitMQPatterns } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';

@Controller()
export class UsersMessageController {
  private readonly logger: LoggerService;

  constructor(
    private readonly usersService: UsersService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(UsersMessageController.name);
  }

  @MessagePattern(RabbitMQPatterns.USER_FIND_BY_EMAIL)
  async findByEmail(@Payload() data: { email: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_FIND_BY_EMAIL} for email: ${data.email}`,
    );

    try {
      // Note: Returns password for authentication purposes (internal RabbitMQ communication)
      const user = await this.usersService.findByEmail(data.email);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_FIND_BY_EMAIL} for email: ${data.email} (will ACK)`,
      );
      return user; // Return user with password for auth service
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_FIND_BY_EMAIL} for email: ${data.email} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_FIND_BY_USERNAME)
  async findByUsername(@Payload() data: { username: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_FIND_BY_USERNAME} for username: ${data.username}`,
    );

    try {
      // Note: Returns password for authentication purposes (internal RabbitMQ communication)
      const user = await this.usersService.findByUsername(data.username);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_FIND_BY_USERNAME} for username: ${data.username} (will ACK)`,
      );
      return user; // Return user with password for auth service
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_FIND_BY_USERNAME} for username: ${data.username} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_FIND_BY_ID)
  async findById(@Payload() data: { id: string }) {
    this.logger.log(`Received message: ${RabbitMQPatterns.USER_FIND_BY_ID} for id: ${data.id}`);

    try {
      const user = await this.usersService.findOne(data.id);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_FIND_BY_ID} for id: ${data.id} (will ACK)`,
      );
      return user;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_FIND_BY_ID} for id: ${data.id} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_GET_PROFILE)
  async getProfile(@Payload() data: { userId: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_GET_PROFILE} for userId: ${data.userId}`,
    );

    try {
      const result = await this.usersService.getProfile(data.userId);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_GET_PROFILE} for userId: ${data.userId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_GET_PROFILE} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_CREATE_GUEST)
  async createGuest(
    @Payload() data: { deviceId: string; devicePlatform: string; deviceMetadata?: any },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_CREATE_GUEST} for device: ${data.deviceId} (${data.devicePlatform})`,
    );

    try {
      const guestUser = await this.usersService.createGuest(
        data.deviceId,
        data.devicePlatform as any,
        data.deviceMetadata,
      );
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_CREATE_GUEST} for device: ${data.deviceId} (will ACK)`,
      );
      return guestUser;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_CREATE_GUEST} for device: ${data.deviceId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_FIND_BY_DEVICE)
  async findByDevice(@Payload() data: { deviceId: string; devicePlatform: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_FIND_BY_DEVICE} for device: ${data.deviceId} (${data.devicePlatform})`,
    );

    try {
      const guestUser = await this.usersService.findByDeviceId(
        data.deviceId,
        data.devicePlatform as any,
      );
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_FIND_BY_DEVICE} for device: ${data.deviceId} (will ACK)`,
      );
      return guestUser;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_FIND_BY_DEVICE} for device: ${data.deviceId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_CONVERT_GUEST)
  async convertGuest(
    @Payload()
    data: {
      guestUserId: string;
      email: string;
      username?: string | null;
      password: string;
      firstName?: string | null;
      lastName?: string | null;
      cityId?: string;
    },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_CONVERT_GUEST} for guestUserId: ${data.guestUserId}`,
    );

    try {
      const registeredUser = await this.usersService.convertGuestToUser(data.guestUserId, {
        email: data.email,
        username: data.username || undefined,
        password: data.password,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        cityId: data.cityId,
      });
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_CONVERT_GUEST} for guestUserId: ${data.guestUserId} (will ACK)`,
      );
      return registeredUser;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_CONVERT_GUEST} for guestUserId: ${data.guestUserId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_FIND_BY_CITY)
  async findByCity(@Payload() data: { cityId: string; page?: number; limit?: number }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_FIND_BY_CITY} for cityId: ${data.cityId}`,
    );

    try {
      const result = await this.usersService.findByCity(
        data.cityId,
        data.page || 1,
        data.limit || 100,
      );
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_FIND_BY_CITY} for cityId: ${data.cityId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_FIND_BY_CITY} for cityId: ${data.cityId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_FIND_ALL_ACTIVE)
  async findAllActive(@Payload() data: { page?: number; limit?: number }) {
    this.logger.log(`Received message: ${RabbitMQPatterns.USER_FIND_ALL_ACTIVE}`);

    try {
      const result = await this.usersService.findAllActive(data.page || 1, data.limit || 100);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_FIND_ALL_ACTIVE} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_FIND_ALL_ACTIVE} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @EventPattern(RabbitMQPatterns.VERIFICATION_VERIFIED)
  async handleVerificationVerified(
    @Payload()
    data: {
      userId: string;
      type: string;
      identifier: string;
      verifiedAt: string;
      timestamp: string;
    },
  ) {
    this.logger.log(
      `Received event: ${RabbitMQPatterns.VERIFICATION_VERIFIED} for userId: ${data.userId}`,
    );

    try {
      // Only handle EMAIL verification
      if (data.type === 'EMAIL') {
        const result = await this.usersService.markEmailAsVerified(data.userId);
        this.logger.log(
          `Email verified for user: ${data.userId} via event ${RabbitMQPatterns.VERIFICATION_VERIFIED}`,
        );
        return result;
      }

      // For SMS or other types, just log
      this.logger.debug(`Verification event received for type: ${data.type}, skipping`);
    } catch (error) {
      this.logger.error(
        `Error processing event: ${RabbitMQPatterns.VERIFICATION_VERIFIED} for userId: ${data.userId}`,
        error,
      );
      // Note: For @EventPattern, errors are logged but don't NACK since it's fire-and-forget
      // The event will be lost if processing fails, which is expected behavior for events
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_UPDATE_ROLE)
  async updateRole(@Payload() data: { userId: string; role: string; updatedBy?: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_UPDATE_ROLE} for userId: ${data.userId}, role: ${data.role}`,
    );

    try {
      const result = await this.usersService.updateUserRole(data.userId, data.role, data.updatedBy);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_UPDATE_ROLE} for userId: ${data.userId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_UPDATE_ROLE} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_GET_DEVICES)
  async getDevices(@Payload() data: { userId: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_GET_DEVICES} for userId: ${data.userId}`,
    );

    try {
      // Include FCM tokens for internal service calls (needed for push notifications)
      const devices = await this.usersService.getDevices(data.userId, true);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_GET_DEVICES} for userId: ${data.userId} - found ${devices.length} device(s) (will ACK)`,
      );
      return devices;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_GET_DEVICES} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_REGISTER_DEVICE)
  async registerDevice(
    @Payload()
    data: {
      userId: string;
      deviceId?: string;
      fcmToken: string;
      platform: string;
      appVersion?: string;
      osVersion?: string;
      language?: string;
      cityId?: string;
    },
  ) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_REGISTER_DEVICE} for userId: ${data.userId}`,
    );

    try {
      const device = await this.usersService.registerDevice(data.userId, {
        deviceId: data.deviceId,
        fcmToken: data.fcmToken,
        platform: data.platform as any,
        appVersion: data.appVersion,
        osVersion: data.osVersion,
        language: data.language,
        cityId: data.cityId,
      });
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_REGISTER_DEVICE} for userId: ${data.userId} (will ACK)`,
      );
      return device;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_REGISTER_DEVICE} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_DELETE_DEVICE)
  async deleteDevice(@Payload() data: { userId: string; deviceId: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_DELETE_DEVICE} for userId: ${data.userId}, deviceId: ${data.deviceId}`,
    );

    try {
      const result = await this.usersService.deleteDevice(data.userId, data.deviceId);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_DELETE_DEVICE} for userId: ${data.userId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_DELETE_DEVICE} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_GET_TOPIC_SUBSCRIPTIONS)
  async getTopicSubscriptions(@Payload() data: { userId: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_GET_TOPIC_SUBSCRIPTIONS} for userId: ${data.userId}`,
    );

    try {
      const subscriptions = await this.usersService.getTopicSubscriptions(data.userId);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_GET_TOPIC_SUBSCRIPTIONS} for userId: ${data.userId} (will ACK)`,
      );
      return subscriptions;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_GET_TOPIC_SUBSCRIPTIONS} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_SUBSCRIBE_TOPIC)
  async subscribeTopic(@Payload() data: { userId: string; topicKey: string; cityId?: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_SUBSCRIBE_TOPIC} for userId: ${data.userId}, topicKey: ${data.topicKey}`,
    );

    try {
      const subscription = await this.usersService.subscribeTopic(data.userId, {
        topicKey: data.topicKey,
        cityId: data.cityId,
      });
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_SUBSCRIBE_TOPIC} for userId: ${data.userId} (will ACK)`,
      );
      return subscription;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_SUBSCRIBE_TOPIC} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }

  @MessagePattern(RabbitMQPatterns.USER_UNSUBSCRIBE_TOPIC)
  async unsubscribeTopic(@Payload() data: { userId: string; topicKey: string }) {
    this.logger.log(
      `Received message: ${RabbitMQPatterns.USER_UNSUBSCRIBE_TOPIC} for userId: ${data.userId}, topicKey: ${data.topicKey}`,
    );

    try {
      const result = await this.usersService.unsubscribeTopic(data.userId, data.topicKey);
      this.logger.debug(
        `Successfully processed message: ${RabbitMQPatterns.USER_UNSUBSCRIBE_TOPIC} for userId: ${data.userId} (will ACK)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing message: ${RabbitMQPatterns.USER_UNSUBSCRIBE_TOPIC} for userId: ${data.userId} (will NACK)`,
        error,
      );
      throw error; // Throwing error causes NestJS to NACK the message
    }
  }
}
