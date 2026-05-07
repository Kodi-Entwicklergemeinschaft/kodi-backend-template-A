import { Injectable } from '@nestjs/common';
import { ConfigService } from '@kodi/config';
import { BaseCustomException } from './custom-exceptions';
import { ErrorCode } from './error-codes.enum';
import { LoggerService, ChildLogger } from '@kodi/logger';

export interface ErrorReport {
  id: string;
  timestamp: string;
  errorCode: ErrorCode;
  message: string;
  stack?: string;
  context: {
    service: string;
    environment: string;
    version: string;
    requestId?: string;
    userId?: string;
    jobId?: string;
    operation?: string;
    metadata?: Record<string, any>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Record<ErrorCode, number>;
  errorsBySeverity: Record<string, number>;
  errorsByService: Record<string, number>;
  recentErrors: ErrorReport[];
  errorRate: number; // errors per minute
  topErrors: Array<{ code: ErrorCode; count: number; message: string }>;
}

@Injectable()
export class ErrorReportingService {
  private readonly structuredLogger: ChildLogger;
  private readonly errorHistory: ErrorReport[] = [];
  private readonly maxHistorySize = 1000;
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly version: string;

  constructor(
    private readonly configService: ConfigService,
    loggerService: LoggerService,
  ) {
    this.serviceName = this.configService.get<string>('serviceName', 'ErrorReportingService');
    this.environment = this.configService.get<string>('nodeEnv', 'development');
    this.version = this.configService.get<string>('serviceVersion', '1.0.0');
    this.structuredLogger = loggerService.createChildLogger({
      operation: 'error-reporting',
    });
  }

  reportError(
    error: Error | BaseCustomException,
    context?: {
      requestId?: string;
      userId?: string;
      jobId?: string;
      operation?: string;
      metadata?: Record<string, any>;
    },
  ): string {
    const errorReport = this.createErrorReport(error, context);

    // Store in memory (in production, you'd send to external service)
    this.storeError(errorReport);

    // Log the error
    this.logError(errorReport);

    // Send to external monitoring service if configured
    this.sendToExternalService(errorReport);

    return errorReport.id;
  }

  getErrorMetrics(timeWindow?: number): ErrorMetrics {
    const windowStart = timeWindow ? Date.now() - timeWindow : 0;
    const relevantErrors = this.errorHistory.filter(
      (error) => new Date(error.timestamp).getTime() > windowStart,
    );

    const errorsByCode = this.groupBy(relevantErrors, 'errorCode');
    const errorsBySeverity = this.groupBy(relevantErrors, 'severity');
    const errorsByService = this.groupBy(relevantErrors, (error) => error.context.service);

    const topErrors = Object.entries(errorsByCode)
      .map(([code, errors]) => ({
        code: code as ErrorCode,
        count: errors.length,
        message: errors[0]?.message || 'Unknown error',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorRate = timeWindow ? relevantErrors.length / (timeWindow / 60000) : 0;

    return {
      totalErrors: relevantErrors.length,
      errorsByCode: this.countBy(errorsByCode),
      errorsBySeverity: this.countBy(errorsBySeverity),
      errorsByService: this.countBy(errorsByService),
      recentErrors: relevantErrors.slice(-20).reverse(),
      errorRate,
      topErrors,
    };
  }

  getErrorById(errorId: string): ErrorReport | undefined {
    return this.errorHistory.find((error) => error.id === errorId);
  }

  getErrorsByCode(errorCode: ErrorCode, limit = 50): ErrorReport[] {
    return this.errorHistory
      .filter((error) => error.errorCode === errorCode)
      .slice(-limit)
      .reverse();
  }

  getErrorTrends(timeWindow = 24 * 60 * 60 * 1000): Array<{ timestamp: string; count: number }> {
    const windowStart = Date.now() - timeWindow;
    const relevantErrors = this.errorHistory.filter(
      (error) => new Date(error.timestamp).getTime() > windowStart,
    );

    // Group errors by hour
    const hourlyErrors = new Map<string, number>();

    relevantErrors.forEach((error) => {
      const hour = new Date(error.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      hourlyErrors.set(hour, (hourlyErrors.get(hour) || 0) + 1);
    });

    return Array.from(hourlyErrors.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  clearErrorHistory(): void {
    this.errorHistory.length = 0;
    this.structuredLogger.log('Error history cleared', {});
  }

  private createErrorReport(
    error: Error | BaseCustomException,
    context?: {
      requestId?: string;
      userId?: string;
      jobId?: string;
      operation?: string;
      metadata?: Record<string, any>;
    },
  ): ErrorReport {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();

    let errorCode: ErrorCode;
    let severity: 'low' | 'medium' | 'high' | 'critical';
    let tags: string[] = [];

    if (error instanceof BaseCustomException) {
      errorCode = error.errorCode;
      severity = this.getSeverityFromErrorCode(errorCode);
      tags = this.getTagsFromErrorCode(errorCode);
    } else {
      errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      severity = 'high';
      tags = ['unhandled', 'internal'];
    }

    return {
      id: errorId,
      timestamp,
      errorCode,
      message: (error as Error).message,
      stack: (error as Error).stack,
      context: {
        service: this.serviceName,
        environment: this.environment,
        version: this.version,
        ...context,
      },
      severity,
      tags,
    };
  }

  private storeError(errorReport: ErrorReport): void {
    this.errorHistory.push(errorReport);

    // Keep history size manageable
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.splice(0, this.errorHistory.length - this.maxHistorySize);
    }
  }

  private logError(errorReport: ErrorReport): void {
    const logMessage = `Error ${errorReport.id}: ${errorReport.message}`;
    const logContext = {
      errorId: errorReport.id,
      errorCode: errorReport.errorCode,
      severity: errorReport.severity,
      tags: errorReport.tags,
      ...errorReport.context,
    };

    switch (errorReport.severity) {
      case 'critical':
        this.structuredLogger.error(`CRITICAL: ${logMessage}`, errorReport.stack, logContext);
        break;
      case 'high':
        this.structuredLogger.error(`HIGH: ${logMessage}`, errorReport.stack, logContext);
        break;
      case 'medium':
        this.structuredLogger.warn(`MEDIUM: ${logMessage}`, logContext);
        break;
      case 'low':
        this.structuredLogger.log(`LOW: ${logMessage}`, logContext);
        break;
    }
  }

  private sendToExternalService(errorReport: ErrorReport): void {
    // In production, you would send this to services like:
    // - Sentry
    // - Rollbar
    // - Bugsnag
    // - Custom monitoring service

    const externalServiceUrl = this.configService.get<string>('ERROR_REPORTING_URL');
    if (!externalServiceUrl) {
      return;
    }

    // Example implementation (you'd use actual HTTP client)
    this.structuredLogger.debug(
      `Would send error report ${errorReport.id} to ${externalServiceUrl}`,
      {
        errorId: errorReport.id,
        externalServiceUrl,
      },
    );
  }

  private getSeverityFromErrorCode(errorCode: ErrorCode): 'low' | 'medium' | 'high' | 'critical' {
    const criticalErrors = [
      ErrorCode.DATABASE_CONNECTION_ERROR,
      ErrorCode.REDIS_CONNECTION_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
    ];

    const highErrors = [
      ErrorCode.DATABASE_QUERY_ERROR,
      ErrorCode.JOB_PROCESSING_ERROR,
      ErrorCode.QUEUE_OPERATION_ERROR,
    ];

    const mediumErrors = [
      ErrorCode.JOB_NOT_FOUND,
      ErrorCode.VALIDATION_ERROR,
      ErrorCode.AUTH_TOKEN_INVALID,
    ];

    if (criticalErrors.includes(errorCode)) return 'critical';
    if (highErrors.includes(errorCode)) return 'high';
    if (mediumErrors.includes(errorCode)) return 'medium';
    return 'low';
  }

  private getTagsFromErrorCode(errorCode: ErrorCode): string[] {
    const tags: string[] = [];

    if ((errorCode as string).includes('DATABASE')) tags.push('database');
    if ((errorCode as string).includes('REDIS') || (errorCode as string).includes('QUEUE'))
      tags.push('queue');
    if ((errorCode as string).includes('JOB')) tags.push('job');
    if ((errorCode as string).includes('AUTH')) tags.push('auth');
    if ((errorCode as string).includes('SCRAPING')) tags.push('scraping');
    if ((errorCode as string).includes('VALIDATION')) tags.push('validation');
    if ((errorCode as string).includes('TIMEOUT')) tags.push('timeout');
    if ((errorCode as string).includes('NETWORK')) tags.push('network');

    return tags;
  }

  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `err_${timestamp}_${random}`;
  }

  private groupBy<T>(array: T[], keyFn: string | ((item: T) => string)): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const key = typeof keyFn === 'string' ? (item as any)[keyFn] : keyFn(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  private countBy(groups: Record<string, any[]>): Record<string, number> {
    return Object.entries(groups).reduce(
      (counts, [key, items]) => {
        counts[key] = items.length;
        return counts;
      },
      {} as Record<string, number>,
    );
  }
}
