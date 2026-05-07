import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@kodi/config';
import * as winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface LogContext {
  requestId?: string;
  userId?: string;
  jobId?: string;
  queueName?: string;
  operation?: string;
  duration?: number;
  errorId?: string;
  alertId?: string;
  ruleId?: string;
  severity?: string;
  message?: string;
  updates?: any;
  metadata?: Record<string, any>;
  [key: string]: any;
}

// Async context for request tracking
export const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;
  private serviceName: string;
  private environment: string;
  private version: string;
  private enableFileLogging: boolean;
  private logDir: string;

  constructor(private readonly configService?: ConfigService) {
    this.serviceName = this.configService?.get<string>('serviceName') || 'kodi-service';
    this.environment = this.configService?.get<string>('nodeEnv') || 'development';
    this.version = this.configService?.get<string>('serviceVersion') || '1.0.0';
    this.enableFileLogging = this.configService?.get<boolean>('enableFileLogging', false) ?? false;
    this.logDir = this.configService?.get<string>('logDir', './logs') ?? './logs';

    this.logger = this.createLogger();

    if (this.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Set context for this logger instance
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Create Winston logger instance
   */
  private createLogger(): winston.Logger {
    const logLevel = this.configService?.get<string>('logLevel', 'info');
    const isDevelopment = this.environment !== 'production';

    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: {
        service: this.serviceName,
        environment: this.environment,
        version: this.version,
      },
      transports: [
        new winston.transports.Console({
          format: isDevelopment
            ? winston.format.combine(
                winston.format.printf(
                  ({
                    _timestamp,
                    level,
                    message,
                    context,
                    _service,
                    ...meta
                  }: winston.Logform.TransformableInfo & { context?: string }) => {
                    return this.formatNestJSLog(
                      String(level),
                      String(message),
                      context as string | undefined,
                      meta,
                    );
                  },
                ),
              )
            : winston.format.json(),
        }),
      ],
    });
  }

  /**
   * Format logs in NestJS style
   */
  private formatNestJSLog(level: string, message: string, context?: string, meta?: any): string {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const pid = process.pid;

    // Color codes for different log levels
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[32m', // Green
      debug: '\x1b[35m', // Magenta
      verbose: '\x1b[36m', // Cyan
    };
    const reset = '\x1b[0m';

    const levelColor = colors[level] || '';
    const levelText = level.toUpperCase().padStart(7);

    // Service name in yellow
    const serviceStr = `${colors['warn']}[${this.serviceName}]${reset}`;

    // Context info
    const ctx = context || this.context || '';
    const ctxStr = ctx ? `${colors['verbose']}[${ctx}]${reset} ` : '';
    let contextInfo = '';
    if (meta) {
      const contextParts: string[] = [];
      if (meta.requestId) contextParts.push(`req:${meta.requestId}`);
      if (meta.userId) contextParts.push(`user:${meta.userId}`);
      if (meta.jobId) contextParts.push(`job:${meta.jobId}`);
      if (meta.queueName) contextParts.push(`queue:${meta.queueName}`);
      if (meta.operation) contextParts.push(`op:${meta.operation}`);
      if (meta.duration !== undefined) contextParts.push(`${meta.duration}ms`);

      if (contextParts.length > 0) {
        contextInfo = ` (${contextParts.join(', ')})`;
      }
    }

    let fullMessage = message + contextInfo;

    // Add error info if present
    if (meta?.trace) {
      fullMessage += `\n${meta.trace}`;
    }

    return `[Nest] ${pid}  - ${timestamp}   ${levelColor}${levelText}${reset} ${serviceStr} ${ctxStr}${fullMessage}`;
  }

  /**
   * Get context from async local storage
   */
  private getAsyncContext(): LogContext {
    return asyncLocalStorage.getStore() || {};
  }

  /**
   * Build log metadata
   */
  private buildMeta(meta?: any): any {
    const asyncContext = this.getAsyncContext();
    return {
      context: this.context,
      ...asyncContext,
      ...meta,
    };
  }

  /**
   * Basic log methods
   */
  log(message: any, context?: string | LogContext, meta?: any) {
    let logContext: string | undefined;
    let logMeta: any;

    if (typeof context === 'string') {
      logContext = context;
      logMeta = meta;
    } else {
      logContext = this.context;
      logMeta = { ...context, ...meta };
    }

    this.logger.info(message, this.buildMeta({ context: logContext, ...logMeta }));

    // Write to file if enabled
    if (this.enableFileLogging) {
      this.writeToFile('log', message, logMeta);
    }
  }

  error(message: any, trace?: string | Error, context?: string | LogContext, meta?: any) {
    let logContext: string | undefined;
    let logMeta: any;
    let errorTrace: string | undefined;

    if (typeof trace === 'string') {
      errorTrace = trace;
    } else if (trace instanceof Error) {
      errorTrace = trace.stack;
      logMeta = { errorName: trace.name, ...logMeta };
    }

    if (typeof context === 'string') {
      logContext = context;
      logMeta = { ...logMeta, ...meta };
    } else {
      logContext = this.context;
      logMeta = { ...logMeta, ...context, ...meta };
    }

    this.logger.error(
      message,
      this.buildMeta({
        context: logContext,
        trace: errorTrace,
        ...logMeta,
      }),
    );

    // Write to file if enabled
    if (this.enableFileLogging) {
      this.writeToFile('error', message, { ...logMeta, trace: errorTrace });
    }
  }

  warn(message: any, context?: string | LogContext, meta?: any) {
    let logContext: string | undefined;
    let logMeta: any;

    if (typeof context === 'string') {
      logContext = context;
      logMeta = meta;
    } else {
      logContext = this.context;
      logMeta = { ...context, ...meta };
    }

    this.logger.warn(message, this.buildMeta({ context: logContext, ...logMeta }));

    // Write to file if enabled
    if (this.enableFileLogging) {
      this.writeToFile('warn', message, logMeta);
    }
  }

  debug(message: any, context?: string | LogContext, meta?: any) {
    let logContext: string | undefined;
    let logMeta: any;

    if (typeof context === 'string') {
      logContext = context;
      logMeta = meta;
    } else {
      logContext = this.context;
      logMeta = { ...context, ...meta };
    }

    this.logger.debug(message, this.buildMeta({ context: logContext, ...logMeta }));

    // Write to file if enabled
    if (this.enableFileLogging) {
      this.writeToFile('debug', message, logMeta);
    }
  }

  verbose(message: any, context?: string | LogContext, meta?: any) {
    let logContext: string | undefined;
    let logMeta: any;

    if (typeof context === 'string') {
      logContext = context;
      logMeta = meta;
    } else {
      logContext = this.context;
      logMeta = { ...context, ...meta };
    }

    this.logger.verbose(message, this.buildMeta({ context: logContext, ...logMeta }));

    // Write to file if enabled
    if (this.enableFileLogging) {
      this.writeToFile('verbose', message, logMeta);
    }
  }

  /**
   * Performance logging
   */
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    const performanceContext: LogContext = {
      ...context,
      operation,
      duration,
    };

    if (duration > 5000) {
      this.warn(`Slow operation detected: ${operation} took ${duration}ms`, performanceContext);
    } else if (duration > 1000) {
      this.log(`Operation completed: ${operation} took ${duration}ms`, performanceContext);
    } else {
      this.debug(`Operation completed: ${operation} took ${duration}ms`, performanceContext);
    }
  }

  /**
   * Job-specific logging
   */
  logJobEvent(
    jobId: string,
    event: 'created' | 'started' | 'completed' | 'failed' | 'paused' | 'resumed',
    message: string,
    context?: LogContext,
  ): void {
    const jobContext: LogContext = {
      ...context,
      jobId,
      operation: `job_${event}`,
    };

    switch (event) {
      case 'failed':
        this.error(`Job ${jobId}: ${message}`, undefined, jobContext);
        break;
      case 'completed':
        this.log(`Job ${jobId}: ${message}`, jobContext);
        break;
      default:
        this.log(`Job ${jobId}: ${message}`, jobContext);
    }
  }

  /**
   * Queue-specific logging
   */
  logQueueEvent(
    queueName: string,
    event: 'job_added' | 'job_completed' | 'job_failed' | 'queue_paused' | 'queue_resumed',
    message: string,
    context?: LogContext,
  ): void {
    const queueContext: LogContext = {
      ...context,
      queueName,
      operation: `queue_${event}`,
    };

    this.log(`Queue ${queueName}: ${message}`, queueContext);
  }

  /**
   * Database operation logging
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    recordCount?: number,
    context?: LogContext,
  ): void {
    const dbContext: LogContext = {
      ...context,
      operation: `db_${operation}`,
      duration,
      metadata: {
        table,
        recordCount,
      },
    };

    this.logPerformance(`Database ${operation} on ${table}`, duration, dbContext);
  }

  /**
   * HTTP request logging
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void {
    const httpContext: LogContext = {
      ...context,
      operation: 'http_request',
      duration,
      metadata: {
        method,
        url,
        statusCode,
      },
    };

    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;

    if (statusCode >= 500) {
      this.error(message, undefined, httpContext);
    } else if (statusCode >= 400) {
      this.warn(message, httpContext);
    } else {
      this.log(message, httpContext);
    }
  }

  /**
   * Security event logging
   */
  logSecurityEvent(
    event: 'auth_success' | 'auth_failure' | 'permission_denied' | 'suspicious_activity',
    message: string,
    context?: LogContext,
  ): void {
    const securityContext: LogContext = {
      ...context,
      operation: `security_${event}`,
    };

    if (
      event === 'auth_failure' ||
      event === 'permission_denied' ||
      event === 'suspicious_activity'
    ) {
      this.warn(`Security Event - ${event}: ${message}`, securityContext);
    } else {
      this.log(`Security Event - ${event}: ${message}`, securityContext);
    }
  }

  /**
   * Convenience methods for structured logging (legacy support)
   */
  logRequest(method: string, url: string, statusCode: number, duration: number) {
    this.logHttpRequest(method, url, statusCode, duration);
  }

  logError(error: Error, context?: string) {
    this.error(error.message, error.stack, context || this.context, {
      errorName: error.name,
    });
  }

  /**
   * Utility method to create a child logger with default context
   */
  createChildLogger(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }

  /**
   * Get the underlying Winston logger
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.warn(`Failed to create log directory: ${error.message}. File logging disabled.`);
    }
  }

  /**
   * Write log entry to file
   */
  private async writeToFile(level: string, message: string, context?: LogContext): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        service: this.serviceName,
        environment: this.environment,
        version: this.version,
      };
      const logLine = JSON.stringify(logEntry) + '\n';
      const logFile = join(this.logDir, `${this.serviceName.toLowerCase()}.log`);
      await writeFile(logFile, logLine, { flag: 'a' });
    } catch (error) {
      // Don't throw errors for file logging failures to avoid breaking the application
    }
  }
}

/**
 * Child logger class for context-specific logging
 */
export class ChildLogger {
  constructor(
    private readonly parent: LoggerService,
    private readonly defaultContext: LogContext,
  ) {}

  log(message: string, context?: LogContext): void {
    this.parent.log(message, { ...this.defaultContext, ...context });
  }

  error(message: string, error?: Error | string, context?: LogContext): void {
    this.parent.error(message, error, { ...this.defaultContext, ...context });
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, { ...this.defaultContext, ...context });
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, { ...this.defaultContext, ...context });
  }

  verbose(message: string, context?: LogContext): void {
    this.parent.verbose(message, { ...this.defaultContext, ...context });
  }

  logPerformance(operation: string, duration: number, context?: LogContext): void {
    this.parent.logPerformance(operation, duration, { ...this.defaultContext, ...context });
  }

  logJobEvent(
    jobId: string,
    event: 'created' | 'started' | 'completed' | 'failed' | 'paused' | 'resumed',
    message: string,
    context?: LogContext,
  ): void {
    this.parent.logJobEvent(jobId, event, message, { ...this.defaultContext, ...context });
  }

  logQueueEvent(
    queueName: string,
    event: 'job_added' | 'job_completed' | 'job_failed' | 'queue_paused' | 'queue_resumed',
    message: string,
    context?: LogContext,
  ): void {
    this.parent.logQueueEvent(queueName, event, message, { ...this.defaultContext, ...context });
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    recordCount?: number,
    context?: LogContext,
  ): void {
    this.parent.logDatabaseOperation(operation, table, duration, recordCount, {
      ...this.defaultContext,
      ...context,
    });
  }

  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void {
    this.parent.logHttpRequest(method, url, statusCode, duration, {
      ...this.defaultContext,
      ...context,
    });
  }

  logSecurityEvent(
    event: 'auth_success' | 'auth_failure' | 'permission_denied' | 'suspicious_activity',
    message: string,
    context?: LogContext,
  ): void {
    this.parent.logSecurityEvent(event, message, { ...this.defaultContext, ...context });
  }
}
