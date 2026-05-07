import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@kodi/config';
import { LoggerModule, LoggerService } from '@kodi/logger';
import { RmqModuleAsyncOptions, RmqModuleOptions } from './rmq.interfaces';
import { getRmqClientOptions } from './rmq.config';
import { RABBITMQ_CLIENT } from './rmq.constants';
import { RmqClientWrapper } from './rmq-client-wrapper';
import { RmqSetupService } from './rmq-setup.service';

/**
 * RabbitMQ Client Injection Token
 * Use with @Inject(RABBITMQ_CLIENT) to inject the ClientProxy
 */
export { RABBITMQ_CLIENT } from './rmq.constants';
export { RmqClientWrapper } from './rmq-client-wrapper';

/**
 * RabbitMQ Module
 * Provides ClientProxy for outgoing messages and configuration helpers
 */
@Global()
@Module({})
export class RmqModule {
  /**
   * Configure RabbitMQ module for outgoing messages (producer/client)
   * Sets up a ClientProxy that can be injected via @Inject(RABBITMQ_CLIENT)
   *
   * @param options - Configuration options
   * @returns DynamicModule
   *
   * @example
   * ```typescript
   * RmqModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     serviceName: 'auth',
   *   }),
   * })
   * ```
   */
  static forRootAsync(options: RmqModuleAsyncOptions): DynamicModule {
    // Create wrapper provider - RABBITMQ_CLIENT now provides RmqClientWrapper
    // Services inject RABBITMQ_CLIENT and get the wrapper with dynamic queue routing
    const wrapperProvider: Provider = {
      provide: RABBITMQ_CLIENT,
      useFactory: async (...args: any[]) => {
        // Find ConfigService in injected dependencies
        const configService = args.find(
          (arg) =>
            arg && typeof arg.get === 'function' && typeof arg.rabbitmqConfig !== 'undefined',
        );
        if (!configService) {
          throw new Error(
            'ConfigService not found in inject array. Make sure ConfigService is included in inject.',
          );
        }

        // Find LoggerService in injected dependencies
        const loggerService = args.find(
          (arg) =>
            arg &&
            typeof arg.setContext === 'function' &&
            typeof arg.log === 'function' &&
            typeof arg.error === 'function',
        );
        if (!loggerService) {
          throw new Error(
            'LoggerService not found in inject array. Make sure LoggerService is available.',
          );
        }

        // Get module options
        const moduleOptions: RmqModuleOptions = options.useFactory
          ? await options.useFactory(...args)
          : {};

        // Get client options
        const clientOptions = getRmqClientOptions(configService, moduleOptions.serviceName);

        // Create base client for wrapper
        // For events (emit), this publishes to kodi_exchange with pattern as routing key
        // RmqClientWrapper will use this for events and create queue-specific clients for request-response (send)
        // Note: NestJS RabbitMQ transport requires a queue for connection, even when publishing to exchange
        // We use an exclusive, auto-delete queue just for the connection
        // The exchange configuration ensures emit() publishes to the exchange, not the queue
        const serviceName = moduleOptions.serviceName || 'client';
        const tempQueueName = `kodi_${serviceName}_temp_${Date.now()}`;
        const baseClient = ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: clientOptions.urls,
            queue: tempQueueName, // Temporary queue for connection only
            queueOptions: {
              exclusive: true,
              autoDelete: true,
              durable: false,
            },
            exchange: clientOptions.exchange, // Publish events to kodi_exchange
            exchangeType: clientOptions.exchangeType, // Topic exchange
            socketOptions: clientOptions.socketOptions,
          },
        } as any);

        // Create and return wrapper - this is what services will inject
        const wrapper = new RmqClientWrapper(baseClient, configService, loggerService);
        return wrapper;
      },
      inject: [...(options.inject || []), LoggerService],
    };

    return {
      module: RmqModule,
      imports: [ConfigModule, LoggerModule],
      providers: [wrapperProvider, RmqSetupService],
      exports: [RABBITMQ_CLIENT],
    };
  }

  /**
   * Configure RabbitMQ module for consuming messages
   * This is mainly for documentation - actual connection is done in main.ts
   * using getRmqConsumerOptions()
   *
   * @param options - Configuration options (currently unused, kept for future extensibility)
   * @returns DynamicModule
   *
   * @example
   * ```typescript
   * // In main.ts:
   * app.connectMicroservice(
   *   getRmqConsumerOptions(configService, 'users')
   * );
   * ```
   */
  static forConsumer(_options?: RmqModuleOptions): DynamicModule {
    return {
      module: RmqModule,
      imports: [ConfigModule, LoggerModule],
      providers: [],
      exports: [],
    };
  }
}
