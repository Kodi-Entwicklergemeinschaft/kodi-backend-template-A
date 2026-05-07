import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@kodi/config';
import { RABBITMQ_EXCHANGE, RABBITMQ_EXCHANGE_TYPE } from './rmq.constants';
import { RmqClientOptions } from './rmq.interfaces';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  PREFETCH_COUNT: 10,
  HEARTBEAT_INTERVAL: 30,
  RECONNECT_TIME: 5,
  MESSAGE_TTL: 30000, // 30 seconds
} as const;

/**
 * Get RabbitMQ connection URL from ConfigService
 */
function getRabbitMQUrl(configService: ConfigService): string {
  const rabbitConfig = configService.rabbitmqConfig;
  return `amqp://${rabbitConfig.user}:${rabbitConfig.password}@${rabbitConfig.host}:${rabbitConfig.port}${rabbitConfig.vhost}`;
}

/**
 * Get RabbitMQ client options for outgoing messages (producer)
 * This creates a ClientProxy that publishes to the exchange
 *
 * @param configService - Configuration service
 * @param serviceName - Optional service name for identification
 * @returns ClientProxy configuration options
 */
export function getRmqClientOptions(
  configService: ConfigService,
  _serviceName?: string,
): RmqClientOptions {
  const url = getRabbitMQUrl(configService);

  return {
    urls: [url],
    exchange: RABBITMQ_EXCHANGE,
    exchangeType: RABBITMQ_EXCHANGE_TYPE,
    socketOptions: {
      heartbeatIntervalInSeconds: DEFAULT_CONFIG.HEARTBEAT_INTERVAL,
      reconnectTimeInSeconds: DEFAULT_CONFIG.RECONNECT_TIME,
    },
  };
}

/**
 * Get RabbitMQ consumer options for incoming messages
 * Creates a service-specific queue bound to the exchange with DLX support
 *
 * @param configService - Configuration service
 * @param serviceName - Name of the service (e.g., 'users', 'core', 'auth')
 * @param options - Optional configuration overrides
 * @returns MicroserviceOptions for app.connectMicroservice
 */
export function getRmqConsumerOptions(
  configService: ConfigService,
  serviceName: string,
  options?: {
    prefetchCount?: number;
    messageTtl?: number;
    durable?: boolean;
  },
): MicroserviceOptions {
  const url = getRabbitMQUrl(configService);
  // Each service uses its own queue (e.g., kodi_users_queue, kodi_core_queue)
  // Queue name format: kodi_{serviceName}_queue
  const queueName = `kodi_${serviceName}_queue`;
  const prefetchCount = options?.prefetchCount ?? DEFAULT_CONFIG.PREFETCH_COUNT;
  const durable = options?.durable ?? true;

  // Queue options
  // Note: DLX and TTL arguments are not set here to avoid conflicts with existing queues
  const queueOptions: any = {
    durable,
    exclusive: false,
    autoDelete: false,
  };

  // NestJS RabbitMQ transport needs exchange configuration to bind @EventPattern handlers
  // to kodi_exchange instead of the default exchange.
  // The exchange and bindings are created by RmqSetupService on module initialization.
  return {
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue: queueName,
      queueOptions,
      prefetchCount,
      // Add exchange configuration so NestJS binds @EventPattern handlers to kodi_exchange
      exchange: RABBITMQ_EXCHANGE,
      exchangeType: RABBITMQ_EXCHANGE_TYPE,
      socketOptions: {
        heartbeatIntervalInSeconds: DEFAULT_CONFIG.HEARTBEAT_INTERVAL,
        reconnectTimeInSeconds: DEFAULT_CONFIG.RECONNECT_TIME,
      },
    } as any, // Type assertion needed - NestJS supports exchange but types don't include it
  };
}
