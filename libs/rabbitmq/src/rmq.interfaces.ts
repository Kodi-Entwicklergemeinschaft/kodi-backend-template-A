/**
 * RabbitMQ module configuration options
 */
export interface RmqModuleOptions {
  /**
   * Service name for logging and identification
   * Optional, defaults to 'default'
   */
  serviceName?: string;
}

/**
 * RabbitMQ client configuration options
 */
export interface RmqClientOptions {
  /**
   * RabbitMQ connection URL
   */
  urls: string[];
  /**
   * Exchange name for message routing
   */
  exchange: string;
  /**
   * Exchange type (topic or direct)
   */
  exchangeType?: 'topic' | 'direct';
  /**
   * Socket options for connection
   */
  socketOptions?: {
    heartbeatIntervalInSeconds?: number;
    reconnectTimeInSeconds?: number;
  };
}

/**
 * RabbitMQ consumer configuration options
 */
export interface RmqConsumerOptions {
  /**
   * RabbitMQ connection URL
   */
  urls: string[];
  /**
   * Service-specific queue name
   */
  queue: string;
  /**
   * Exchange name to bind queue to
   */
  exchange: string;
  /**
   * Exchange type
   */
  exchangeType?: 'topic' | 'direct';
  /**
   * Routing key pattern for queue binding (e.g., 'user.*')
   */
  routingKey: string;
  /**
   * Queue options
   */
  queueOptions: {
    durable: boolean;
    noAck: boolean;
    prefetchCount: number;
    /**
     * Dead Letter Exchange configuration
     */
    deadLetterExchange?: string;
    /**
     * Dead Letter Queue name
     */
    deadLetterQueue?: string;
    /**
     * Message TTL in milliseconds
     */
    messageTtl?: number;
  };
  /**
   * Socket options for connection
   */
  socketOptions?: {
    heartbeatIntervalInSeconds?: number;
    reconnectTimeInSeconds?: number;
  };
}

/**
 * Message contract interface with versioning support
 */
export interface RmqMessage<T = any> {
  /**
   * Message version for contract compatibility
   */
  version: string;
  /**
   * Message payload
   */
  data: T;
  /**
   * Optional metadata
   */
  metadata?: {
    timestamp?: string;
    source?: string;
    correlationId?: string;
    [key: string]: any;
  };
}

/**
 * Factory function type for RmqModule configuration
 */
export type RmqModuleOptionsFactory = () => Promise<RmqModuleOptions> | RmqModuleOptions;

/**
 * Async configuration options for RmqModule.forRootAsync
 */
export interface RmqModuleAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory?: (...args: any[]) => Promise<RmqModuleOptions> | RmqModuleOptions;
  useClass?: any;
  useExisting?: any;
}
