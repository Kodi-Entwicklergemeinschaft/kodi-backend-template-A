import { Injectable } from '@nestjs/common';
import { LoggerService } from '@kodi/logger';
import { ConfigService } from '@kodi/config';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger: LoggerService;
  private readonly register: promClient.Registry;
  private readonly serviceName: string;

  // Common metrics
  public readonly httpRequestDuration: promClient.Histogram;
  public readonly httpRequestTotal: promClient.Counter;
  public readonly httpRequestErrors: promClient.Counter;
  public readonly activeConnections: promClient.Gauge;

  // Database metrics (per-microservice databases)
  public readonly dbQueryDuration: promClient.Histogram;
  public readonly dbQueryTotal: promClient.Counter;
  public readonly dbErrorsTotal: promClient.Counter;
  public readonly dbPoolSize: promClient.Gauge;

  // Redis metrics (shared cache)
  public readonly redisOperationDuration: promClient.Histogram;
  public readonly redisOperationsTotal: promClient.Counter;
  public readonly redisErrorsTotal: promClient.Counter;
  public readonly redisConnected: promClient.Gauge;

  constructor(
    logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger = logger;
    this.logger.setContext(MetricsService.name);
    this.serviceName = this.configService.get<string>('serviceName', 'kodi-service');
    this.register = new promClient.Registry();

    // Set default labels
    this.register.setDefaultLabels({
      service: this.serviceName,
      environment: this.configService.get<string>('nodeEnv', 'development'),
    });

    // Collect default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'kodi_',
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new promClient.Histogram({
      name: 'kodi_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    // HTTP request counter
    this.httpRequestTotal = new promClient.Counter({
      name: 'kodi_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // HTTP error counter
    this.httpRequestErrors = new promClient.Counter({
      name: 'kodi_http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.register],
    });

    // Active connections gauge
    this.activeConnections = new promClient.Gauge({
      name: 'kodi_active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.register],
    });

    // Database metrics
    this.dbQueryDuration = new promClient.Histogram({
      name: 'kodi_db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['model', 'action', 'success'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.dbQueryTotal = new promClient.Counter({
      name: 'kodi_db_query_total',
      help: 'Total number of database queries',
      labelNames: ['model', 'action', 'success'],
      registers: [this.register],
    });

    this.dbErrorsTotal = new promClient.Counter({
      name: 'kodi_db_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['model', 'action'],
      registers: [this.register],
    });

    this.dbPoolSize = new promClient.Gauge({
      name: 'kodi_db_pool_size',
      help: 'Database connection pool size',
      registers: [this.register],
    });

    // Redis metrics (shared cache)
    this.redisOperationDuration = new promClient.Histogram({
      name: 'kodi_redis_operation_duration_seconds',
      help: 'Duration of Redis operations in seconds',
      labelNames: ['command', 'instance', 'success'],
      buckets: [0.0005, 0.001, 0.005, 0.01, 0.05, 0.1, 0.25],
      registers: [this.register],
    });

    this.redisOperationsTotal = new promClient.Counter({
      name: 'kodi_redis_operations_total',
      help: 'Total number of Redis operations',
      labelNames: ['command', 'instance', 'success'],
      registers: [this.register],
    });

    this.redisErrorsTotal = new promClient.Counter({
      name: 'kodi_redis_errors_total',
      help: 'Total number of Redis operation errors',
      labelNames: ['command', 'instance'],
      registers: [this.register],
    });

    this.redisConnected = new promClient.Gauge({
      name: 'kodi_redis_connected',
      help: 'Whether Redis client is connected (1) or not (0)',
      labelNames: ['instance'],
      registers: [this.register],
    });

    this.logger.log('Metrics service initialized');
  }

  /**
   * Create a custom counter
   */
  createCounter(name: string, help: string, labelNames: string[] = []): promClient.Counter {
    return new promClient.Counter({
      name: `kodi_${name}`,
      help,
      labelNames,
      registers: [this.register],
    });
  }

  /**
   * Create a custom gauge
   */
  createGauge(name: string, help: string, labelNames: string[] = []): promClient.Gauge {
    return new promClient.Gauge({
      name: `kodi_${name}`,
      help,
      labelNames,
      registers: [this.register],
    });
  }

  /**
   * Create a custom histogram
   */
  createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ): promClient.Histogram {
    return new promClient.Histogram({
      name: `kodi_${name}`,
      help,
      labelNames,
      buckets,
      registers: [this.register],
    });
  }

  /**
   * Create a custom summary
   */
  createSummary(name: string, help: string, labelNames: string[] = []): promClient.Summary {
    return new promClient.Summary({
      name: `kodi_${name}`,
      help,
      labelNames,
      registers: [this.register],
    });
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    const durationInSeconds = duration / 1000;

    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      durationInSeconds,
    );

    this.httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });

    // Record error if status code >= 400
    if (statusCode >= 400) {
      this.httpRequestErrors.inc({
        method,
        route,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get registry
   */
  getRegistry(): promClient.Registry {
    return this.register;
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.register.resetMetrics();
    this.logger.log('Metrics reset');
  }

  /**
   * Record a database query
   */
  recordDbQuery(model: string, action: string, durationMs: number, success: boolean) {
    const successLabel = success ? 'true' : 'false';
    this.dbQueryDuration.observe({ model, action, success: successLabel }, durationMs / 1000);
    this.dbQueryTotal.inc({ model, action, success: successLabel });
    if (!success) {
      this.dbErrorsTotal.inc({ model, action });
    }
  }

  /**
   * Set current DB pool size (call from wherever pool info is available)
   */
  setDbPoolSize(size: number) {
    this.dbPoolSize.set(size);
  }

  /**
   * Record a Redis operation (shared cache). `instance` helps distinguish clusters or environments.
   */
  recordRedisOperation(
    command: string,
    durationMs: number,
    success: boolean,
    instance: string = 'shared',
  ) {
    const successLabel = success ? 'true' : 'false';
    this.redisOperationDuration.observe(
      { command, instance, success: successLabel },
      durationMs / 1000,
    );
    this.redisOperationsTotal.inc({ command, instance, success: successLabel });
    if (!success) {
      this.redisErrorsTotal.inc({ command, instance });
    }
  }

  /**
   * Update Redis connection gauge (1 connected, 0 disconnected)
   */
  setRedisConnected(connected: boolean, instance: string = 'shared') {
    this.redisConnected.set({ instance }, connected ? 1 : 0);
  }
}
