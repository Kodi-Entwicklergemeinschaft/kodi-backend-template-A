import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ConfigService } from '@kodi/config';
import { LoggerService } from '@kodi/logger';
import * as amqp from 'amqplib';
import { getQueueName, RABBITMQ_CLIENT, RABBITMQ_EXCHANGE } from './rmq.constants';
import { getRmqClientOptions } from './rmq.config';

/**
 * Extract service name from pattern (e.g., 'user.findByEmail' -> 'users')
 */
function getServiceNameFromPattern(pattern: string): string {
  // Pattern format: {service}.{action} (e.g., 'user.findByEmail', 'core.getUserCities')
  const parts = pattern.split('.');
  if (parts.length === 0) {
    throw new Error(`Invalid pattern format: ${pattern}. Expected format: 'service.action'`);
  }

  const servicePrefix = parts[0];
  // Map pattern prefixes to service names
  const serviceMap: Record<string, string> = {
    user: 'users',
    terms: 'users', // Terms service is part of users service
    core: 'core',
    notification: 'notification',
    passwordReset: 'notification',
    verification: 'notification',
    city: 'city',
    integration: 'integration',
    schedule: 'scheduler',
    terminal: 'terminal',
    admin: 'admin',
  };

  const serviceName = serviceMap[servicePrefix] || servicePrefix;
  return serviceName;
}

/**
 * RabbitMQ Client Wrapper
 * Provides a clean interface for sending messages with debug logging
 * Routes messages to service-specific queues based on pattern prefix
 * Creates ClientProxy instances dynamically per service queue
 */
@Injectable()
export class RmqClientWrapper implements OnModuleInit, OnModuleDestroy {
  private clientCache: Map<string, ClientProxy> = new Map();
  private readonly baseClient: ClientProxy;
  private readonly configService: ConfigService;
  private eventChannel: amqp.Channel | null = null;
  private eventConnection: amqp.Connection | null = null;

  constructor(
    @Inject(RABBITMQ_CLIENT) baseClient: ClientProxy,
    configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.baseClient = baseClient;
    this.configService = configService;
    this.logger.setContext('RmqClientWrapper');
  }

  async onModuleInit() {
    // Create a dedicated connection and channel for publishing events to the exchange
    await this.ensureEventChannel();
  }

  async onModuleDestroy() {
    // Clean up event publishing connection
    if (this.eventChannel) {
      try {
        await this.eventChannel.close();
      } catch (error) {
        this.logger.warn('Error closing event channel', error);
      }
      this.eventChannel = null;
    }
    if (this.eventConnection) {
      try {
        await this.eventConnection.close();
      } catch (error) {
        this.logger.warn('Error closing event connection', error);
      }
      this.eventConnection = null;
    }
  }

  private async ensureEventChannel(): Promise<void> {
    if (this.eventChannel && this.eventConnection && !this.eventConnection.closing) {
      return;
    }

    try {
      const rabbitConfig = this.configService.rabbitmqConfig;
      const connectionUrl = `amqp://${rabbitConfig.user}:${rabbitConfig.password}@${rabbitConfig.host}:${rabbitConfig.port}${rabbitConfig.vhost}`;

      this.eventConnection = await amqp.connect(connectionUrl);
      this.eventChannel = await this.eventConnection.createChannel();

      // Assert the exchange exists
      await this.eventChannel.assertExchange(RABBITMQ_EXCHANGE, 'topic', { durable: true });

      this.logger.log(`Event publishing channel established for exchange: ${RABBITMQ_EXCHANGE}`);

      // Handle connection errors
      this.eventConnection.on('error', (err) => {
        this.logger.error('Event connection error, will reconnect on next emit', err);
        this.eventChannel = null;
        this.eventConnection = null;
      });

      this.eventConnection.on('close', () => {
        this.logger.warn('Event connection closed, will reconnect on next emit');
        this.eventChannel = null;
        this.eventConnection = null;
      });
    } catch (error) {
      this.logger.error('Failed to create event channel', error);
      this.eventChannel = null;
      this.eventConnection = null;
      throw error;
    }
  }

  /**
   * Get or create a ClientProxy for a specific service queue
   */
  private getClientForQueue(queueName: string): ClientProxy {
    if (this.clientCache.has(queueName)) {
      return this.clientCache.get(queueName)!;
    }

    const clientOptions = getRmqClientOptions(this.configService);
    const client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: clientOptions.urls,
        queue: queueName, // Send to service-specific queue
        queueOptions: {
          durable: true, // Match consumer queue durability
          exclusive: false,
          autoDelete: false,
        },
        socketOptions: clientOptions.socketOptions,
      },
    });

    this.clientCache.set(queueName, client);
    return client;
  }

  /**
   * Send a message and wait for response (request-response)
   * Routes to service-specific queue based on pattern (e.g., 'user.*' -> 'kodi_users_queue')
   */
  send<TResult = any, TInput = any>(pattern: string, data: TInput): Observable<TResult> {
    const serviceName = getServiceNameFromPattern(pattern);
    const targetQueue = getQueueName(serviceName);

    // Get client for this service's queue
    const client = this.getClientForQueue(targetQueue);

    // Send with original pattern - NestJS will include pattern in message metadata
    // Consumer's @MessagePattern will match based on pattern, not queue name
    const result$ = client.send<TResult, TInput>(pattern, data);
    return result$;
  }

  /**
   * Emit an event (fire and forget)
   * Events are published directly to the exchange using amqplib
   * The exchange routes messages to queues based on routing key pattern
   */
  emit<T = any>(pattern: string, data: T): void {
    this.logger.log(`Emitting event: pattern="${pattern}"`);

    // Fire and forget - handle promise internally
    this.publishEvent(pattern, data).catch((error) => {
      this.logger.error(`Failed to emit event: ${pattern}`, error);
    });
  }

  /**
   * Internal method to publish event to exchange
   */
  private async publishEvent<T = any>(pattern: string, data: T): Promise<void> {
    try {
      // Ensure we have a channel for publishing
      await this.ensureEventChannel();

      if (!this.eventChannel) {
        throw new Error('Event channel not available');
      }

      // NestJS expects messages in a specific format with pattern metadata
      // Format: { pattern: string, data: any }
      const message = {
        pattern: pattern,
        data: data,
      };

      // Publish directly to the exchange with pattern as routing key
      const published = this.eventChannel.publish(
        RABBITMQ_EXCHANGE,
        pattern, // Use pattern as routing key
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true, // Make messages durable
          headers: {
            'x-pattern': pattern, // Additional pattern metadata in headers
          },
        },
      );

      if (!published) {
        // Channel buffer is full, wait a bit and retry
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!this.eventChannel) {
          await this.ensureEventChannel();
        }
        if (!this.eventChannel) {
          throw new Error('Event channel not available after retry');
        }

        // Recreate message with pattern wrapper for retry
        const retryMessage = {
          pattern: pattern,
          data: data,
        };

        const retryPublished = this.eventChannel.publish(
          RABBITMQ_EXCHANGE,
          pattern,
          Buffer.from(JSON.stringify(retryMessage)),
          {
            persistent: true,
            headers: {
              'x-pattern': pattern,
            },
          },
        );

        if (!retryPublished) {
          throw new Error(`Failed to publish event ${pattern} - channel buffer full after retry`);
        }
      }

      this.logger.log(`Successfully emitted event: ${pattern} to exchange ${RABBITMQ_EXCHANGE}`);
    } catch (error) {
      // Reset channel on error so it reconnects on next emit
      this.eventChannel = null;
      if (this.eventConnection) {
        try {
          await this.eventConnection.close();
        } catch (e) {
          // Ignore close errors
        }
        this.eventConnection = null;
      }
      throw error;
    }
  }

  /**
   * Get the underlying client proxy
   */
  getClient(): ClientProxy {
    return this.baseClient;
  }
}
