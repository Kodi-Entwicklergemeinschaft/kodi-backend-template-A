import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp?: Date;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
}

export class BaseCustomException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly context?: Record<string, any>;

  constructor(
    errorDetails: ErrorDetails,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    const response = {
      statusCode: httpStatus,
      errorCode: errorDetails.code,
      message: errorDetails.message,
      timestamp: errorDetails.timestamp || new Date(),
      requestId: errorDetails.requestId,
      details: errorDetails.details,
    };

    super(response, httpStatus);

    this.errorCode = errorDetails.code;
    this.timestamp = errorDetails.timestamp || new Date();
    this.requestId = errorDetails.requestId;
    this.userId = errorDetails.userId;
    this.context = errorDetails.context;
  }
}

// Database related exceptions
export class DatabaseException extends BaseCustomException {
  constructor(message: string, details?: any, context?: Record<string, any>) {
    super(
      {
        code: ErrorCode.DATABASE_QUERY_ERROR,
        message,
        details,
        context,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class DatabaseConnectionException extends BaseCustomException {
  constructor(message: string, details?: any) {
    super(
      {
        code: ErrorCode.DATABASE_CONNECTION_ERROR,
        message,
        details,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class DatabaseTimeoutException extends BaseCustomException {
  constructor(message: string, details?: any) {
    super(
      {
        code: ErrorCode.DATABASE_TIMEOUT_ERROR,
        message,
        details,
      },
      HttpStatus.REQUEST_TIMEOUT,
    );
  }
}

// Queue related exceptions
export class QueueException extends BaseCustomException {
  constructor(message: string, details?: any, context?: Record<string, any>) {
    super(
      {
        code: ErrorCode.QUEUE_OPERATION_ERROR,
        message,
        details,
        context,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class RedisConnectionException extends BaseCustomException {
  constructor(message: string, details?: any) {
    super(
      {
        code: ErrorCode.REDIS_CONNECTION_ERROR,
        message,
        details,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

// Job related exceptions
export class JobNotFoundException extends BaseCustomException {
  constructor(jobId: string, details?: any) {
    super(
      {
        code: ErrorCode.JOB_NOT_FOUND,
        message: `Job with ID ${jobId} not found`,
        details,
        context: { jobId },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class JobInvalidStateException extends BaseCustomException {
  constructor(jobId: string, currentState: string, expectedState: string, details?: any) {
    super(
      {
        code: ErrorCode.JOB_INVALID_STATE,
        message: `Job ${jobId} is in invalid state '${currentState}', expected '${expectedState}'`,
        details,
        context: { jobId, currentState, expectedState },
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class JobScheduleException extends BaseCustomException {
  constructor(jobId: string, cronSchedule: string, details?: any) {
    super(
      {
        code: ErrorCode.JOB_SCHEDULE_ERROR,
        message: `Failed to schedule job ${jobId} with cron '${cronSchedule}'`,
        details,
        context: { jobId, cronSchedule },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class CronValidationException extends BaseCustomException {
  constructor(cronSchedule: string, details?: any) {
    super(
      {
        code: ErrorCode.CRON_VALIDATION_ERROR,
        message: `Invalid cron schedule: ${cronSchedule}`,
        details,
        context: { cronSchedule },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// Scraping related exceptions
export class ScrapingException extends BaseCustomException {
  constructor(url: string, message: string, details?: any) {
    super(
      {
        code: ErrorCode.SCRAPING_NETWORK_ERROR,
        message: `Scraping failed for ${url}: ${message}`,
        details,
        context: { url },
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class ScrapingRateLimitException extends BaseCustomException {
  constructor(url: string, retryAfter?: number, details?: any) {
    super(
      {
        code: ErrorCode.SCRAPING_RATE_LIMIT_ERROR,
        message: `Rate limit exceeded for ${url}`,
        details,
        context: { url, retryAfter },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

// Authentication related exceptions
export class AuthTokenInvalidException extends BaseCustomException {
  constructor(details?: any) {
    super(
      {
        code: ErrorCode.AUTH_TOKEN_INVALID,
        message: 'Invalid authentication token',
        details,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AuthInsufficientPermissionsException extends BaseCustomException {
  constructor(requiredRole: string, userRole: string, details?: any) {
    super(
      {
        code: ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
        message: `Insufficient permissions. Required: ${requiredRole}, User has: ${userRole}`,
        details,
        context: { requiredRole, userRole },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

// Configuration related exceptions
export class ConfigurationException extends BaseCustomException {
  constructor(configKey: string, message: string, details?: any) {
    super(
      {
        code: ErrorCode.CONFIG_MISSING_REQUIRED,
        message: `Configuration error for '${configKey}': ${message}`,
        details,
        context: { configKey },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// External service exceptions
export class ExternalServiceException extends BaseCustomException {
  constructor(serviceName: string, message: string, details?: any) {
    super(
      {
        code: ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
        message: `External service '${serviceName}' error: ${message}`,
        details,
        context: { serviceName },
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
