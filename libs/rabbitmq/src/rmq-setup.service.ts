import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@kodi/config';
import { LoggerService } from '@kodi/logger';
import * as amqp from 'amqplib';
import { RABBITMQ_EXCHANGE, RABBITMQ_EXCHANGE_TYPE, getQueueName } from './rmq.constants';

@Injectable()
export class RmqSetupService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('RmqSetupService');
  }

  async onModuleInit() {
    await this.setupRabbitMQ();
  }

  private async setupRabbitMQ() {
    const rabbitConfig = this.configService.rabbitmqConfig;
    const connectionUrl = `amqp://${rabbitConfig.user}:${rabbitConfig.password}@${rabbitConfig.host}:${rabbitConfig.port}${rabbitConfig.vhost}`;

    let connection: amqp.Connection | null = null;
    let channel: amqp.Channel | null = null;

    try {
      connection = await amqp.connect(connectionUrl);
      channel = await connection.createChannel();

      // Create exchange
      await channel.assertExchange(RABBITMQ_EXCHANGE, RABBITMQ_EXCHANGE_TYPE, {
        durable: true,
      });

      // Create queues and bindings for all services
      const services = [
        'auth',
        'users',
        'core',
        'city',
        'notification',
        'scheduler',
        'terminal',
        'admin',
      ];

      for (const serviceName of services) {
        const queueName = getQueueName(serviceName);

        // Assert queue exists
        await channel.assertQueue(queueName, { durable: true });

        // Bind queue to exchange based on service
        const routingKeys = this.getRoutingKeysForService(serviceName);
        for (const routingKey of routingKeys) {
          await channel.bindQueue(queueName, RABBITMQ_EXCHANGE, routingKey);
        }
      }

      await channel.close();
      await connection.close();
    } catch (error) {
      this.logger.error('Failed to setup RabbitMQ', error);
      if (channel) {
        try {
          await channel.close();
        } catch (e) {
          // Ignore close errors
        }
      }
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          // Ignore close errors
        }
      }
      throw error;
    }
  }

  private getRoutingKeysForService(serviceName: string): string[] {
    const routingMap: Record<string, string[]> = {
      users: ['user.*', 'verification.verified'], // Add verification.verified for email verification updates
      core: ['core.*', 'user.deleted'], // Add user.deleted for cleanup of user favorites/reminders
      city: ['city.*'],
      notification: [
        'user.created',
        'user.updated',
        'notification.*',
        'verification.*',
        'passwordReset.*',
      ],
      scheduler: ['schedule.*'],
      auth: ['user.*'],
      // terminal and admin don't have specific routing keys yet
      terminal: [],
      admin: [],
    };
    return routingMap[serviceName] || [];
  }
}
