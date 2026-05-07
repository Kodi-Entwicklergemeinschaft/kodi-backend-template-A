import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseCustomException } from './custom-exceptions';
import { ErrorCode } from './error-codes.enum';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/library';
import { LoggerService, ChildLogger } from '@kodi/logger';
import { I18nService, LanguageDetectorService } from '@kodi/i18n';
import { ConfigService } from '@kodi/config';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly structuredLogger: ChildLogger;
  private readonly isDevelopment: boolean;

  constructor(
    loggerService: LoggerService,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
    private readonly languageDetector: LanguageDetectorService,
  ) {
    this.structuredLogger = loggerService.createChildLogger({
      operation: 'exception-filter',
    });
    this.isDevelopment = this.configService.get<string>('nodeEnv', 'development') === 'development';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error with appropriate level
    this.logError(exception, request, errorResponse);

    // Check if response has already been sent to prevent "headers already sent" errors
    if (!response.headersSent) {
      try {
        response.status(errorResponse.statusCode).json(errorResponse);
      } catch (responseError) {
        // If we can't send the response, at least log it
        this.structuredLogger.error('Failed to send error response', responseError as Error);
        this.structuredLogger.error('Original error', exception as Error);
      }
    } else {
      // Headers already sent, just log the error
      this.structuredLogger.error('Cannot send error response - headers already sent');
      this.structuredLogger.error('Original error', exception as Error);
    }
  }

  private buildErrorResponse(exception: unknown, request: Request) {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const requestId = this.getRequestId(request);

    // Detect language from request headers
    const language = this.languageDetector.detectLanguage(request.headers['accept-language']);

    // Handle custom exceptions
    if (exception instanceof BaseCustomException) {
      const translatedMessage = this.i18nService.translate(
        `errors.${exception.errorCode}`,
        exception.context,
        language,
      );

      return {
        statusCode: exception.getStatus(),
        errorCode: exception.errorCode,
        message:
          translatedMessage !== `errors.${exception.errorCode}`
            ? translatedMessage
            : exception.message,
        timestamp,
        path,
        method,
        requestId,
        details: exception.context,
      };
    }

    // Handle standard HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Use custom errorCode from exception response if available, otherwise map from status
      const customErrorCode =
        typeof exceptionResponse === 'object' && (exceptionResponse as any).errorCode
          ? (exceptionResponse as any).errorCode
          : this.mapHttpStatusToErrorCode(status);

      const errorCode = customErrorCode;

      const originalMessage =
        typeof exceptionResponse === 'string'
          ? (exceptionResponse as string)
          : (exceptionResponse as any).message;

      const translatedMessage = this.i18nService.translate(
        `errors.${errorCode}`,
        undefined,
        language,
      );

      // Extract details, excluding errorCode and message to avoid duplication
      const responseDetails =
        typeof exceptionResponse === 'object' ? { ...exceptionResponse } : undefined;
      if (responseDetails && 'errorCode' in responseDetails) {
        delete responseDetails.errorCode;
      }
      if (responseDetails && 'message' in responseDetails) {
        delete responseDetails.message;
      }

      // Prioritize translated message when we have a custom errorCode
      const hasCustomErrorCode =
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as any).errorCode &&
        (exceptionResponse as any).errorCode !== this.mapHttpStatusToErrorCode(status);

      const finalMessage = hasCustomErrorCode
        ? translatedMessage !== `errors.${errorCode}`
          ? translatedMessage
          : originalMessage || 'An error occurred'
        : originalMessage && originalMessage !== status.toString()
          ? originalMessage
          : translatedMessage !== `errors.${errorCode}`
            ? translatedMessage
            : originalMessage || 'An error occurred';

      return {
        statusCode: status,
        errorCode,
        message: finalMessage,
        timestamp,
        path,
        method,
        requestId,
        details:
          responseDetails && Object.keys(responseDetails).length > 0 ? responseDetails : undefined,
      };
    }

    // Handle Prisma errors
    if (exception instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, timestamp, path, method, requestId, language);
    }

    if (exception instanceof PrismaClientUnknownRequestError) {
      const translatedMessage = this.i18nService.translate(
        'errors.DATABASE_QUERY_ERROR',
        undefined,
        language,
      );
      // Extract meaningful error from potentially verbose Prisma error
      const errorMessage = exception.message.includes('does not exist')
        ? 'Database table or schema not found. Please run migrations.'
        : exception.message.split('\n')[0] || translatedMessage;

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: ErrorCode.DATABASE_QUERY_ERROR,
        message:
          translatedMessage !== 'errors.DATABASE_QUERY_ERROR' ? translatedMessage : errorMessage,
        timestamp,
        path,
        method,
        requestId,
        details: this.isDevelopment ? { prismaError: exception.message } : undefined,
      };
    }

    // Handle Redis/IORedis errors
    if (this.isRedisError(exception)) {
      const translatedMessage = this.i18nService.translate(
        'errors.REDIS_CONNECTION_ERROR',
        undefined,
        language,
      );

      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        errorCode: ErrorCode.REDIS_CONNECTION_ERROR,
        message: translatedMessage,
        timestamp,
        path,
        method,
        requestId,
        details: { redisError: (exception as Error).message },
      };
    }

    // Handle validation errors
    if (this.isValidationError(exception)) {
      const translatedMessage = this.i18nService.translate(
        'errors.VALIDATION_ERROR',
        undefined,
        language,
      );

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: translatedMessage,
        timestamp,
        path,
        method,
        requestId,
        details: { validationError: (exception as Error).message },
      };
    }

    // Handle timeout errors
    if (this.isTimeoutError(exception)) {
      const translatedMessage = this.i18nService.translate(
        'errors.DATABASE_TIMEOUT_ERROR',
        undefined,
        language,
      );

      return {
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        errorCode: ErrorCode.DATABASE_TIMEOUT_ERROR,
        message: translatedMessage,
        timestamp,
        path,
        method,
        requestId,
        details: { timeoutError: (exception as Error).message },
      };
    }

    // Handle unknown errors
    const translatedMessage = this.i18nService.translate(
      'errors.INTERNAL_SERVER_ERROR',
      undefined,
      language,
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      message: translatedMessage,
      timestamp,
      path,
      method,
      requestId,
      details: this.isDevelopment
        ? {
            error: (exception as Error).message,
            stack: (exception as Error).stack,
          }
        : undefined,
    };
  }

  private handlePrismaError(
    exception: PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
    method: string,
    requestId: string,
    language: string,
  ) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCode.DATABASE_QUERY_ERROR;
    let userMessage = '';

    switch (exception.code) {
      case 'P2002':
        statusCode = HttpStatus.CONFLICT;
        errorCode = ErrorCode.DATABASE_CONSTRAINT_ERROR;
        // Extract field name from meta if available
        const field = (exception.meta as any)?.target?.[0] || 'field';
        userMessage = `A record with this ${field} already exists`;
        break;
      case 'P2025':
        statusCode = HttpStatus.NOT_FOUND;
        errorCode = ErrorCode.NOT_FOUND;
        userMessage = exception.message || 'Record not found';
        break;
      case 'P2003':
        statusCode = HttpStatus.BAD_REQUEST;
        errorCode = ErrorCode.DATABASE_CONSTRAINT_ERROR;
        userMessage = 'Invalid reference to related record';
        break;
      case 'P2024':
        statusCode = HttpStatus.REQUEST_TIMEOUT;
        errorCode = ErrorCode.DATABASE_TIMEOUT_ERROR;
        userMessage = 'Database operation timed out';
        break;
      default:
        // For other errors, extract meaningful message
        if (exception.message.includes('does not exist')) {
          userMessage = 'Database table or schema not found. Please run migrations.';
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        } else {
          userMessage = exception.message.split('\n')[0]; // Get first line only
        }
    }

    const translatedMessage = this.i18nService.translate(
      `errors.${errorCode}`,
      undefined,
      language,
    );
    const message =
      translatedMessage !== `errors.${errorCode}`
        ? translatedMessage
        : userMessage || exception.message;

    return {
      statusCode,
      errorCode,
      message,
      timestamp,
      path,
      method,
      requestId,
      details: this.isDevelopment
        ? {
            prismaCode: exception.code,
            prismaMessage: exception.message,
            meta: exception.meta,
          }
        : undefined,
    };
  }

  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.REQUEST_TIMEOUT:
        return ErrorCode.DATABASE_TIMEOUT_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.SCRAPING_RATE_LIMIT_ERROR;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCode.INTERNAL_SERVER_ERROR;
      case HttpStatus.BAD_GATEWAY:
        return ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  private isRedisError(exception: unknown): boolean {
    return !!(
      exception instanceof Error &&
      (exception.message.includes('Redis') ||
        exception.message.includes('ECONNREFUSED') ||
        exception.message.includes('Connection is closed'))
    );
  }

  private isValidationError(exception: unknown): boolean {
    return !!(
      exception instanceof Error &&
      (exception.name === 'ValidationError' ||
        exception.message.includes('validation') ||
        exception.message.includes('Invalid input'))
    );
  }

  private isTimeoutError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      ((exception.message && exception.message.includes('timeout')) ||
        (exception.message && exception.message.includes('ETIMEDOUT')) ||
        exception.name === 'TimeoutError')
    );
  }

  private getRequestId(request: Request): string {
    return (
      (request.headers['x-request-id'] as string) ||
      (request as any).id ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
  }

  private logError(exception: unknown, request: Request, errorResponse: any): void {
    const { statusCode, errorCode, message, requestId } = errorResponse;
    const { method, url, ip, headers } = request;

    const logContext = {
      requestId,
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      statusCode,
      errorCode,
      userId: (request as any).user?.id,
    };

    // Log with appropriate level based on status code
    if (statusCode >= 500) {
      // For server errors, include exception details only in development
      const exceptionError =
        this.isDevelopment && exception instanceof Error ? exception : undefined;
      this.structuredLogger.error(
        `${method} ${url} - ${statusCode} ${errorCode}: ${message}`,
        exceptionError,
        logContext,
      );
    } else if (statusCode >= 400) {
      // For client errors (4xx), don't include stack traces - just log the message
      this.structuredLogger.warn(
        `${method} ${url} - ${statusCode} ${errorCode}: ${message}`,
        logContext,
      );
    } else {
      this.structuredLogger.log(
        `${method} ${url} - ${statusCode} ${errorCode}: ${message}`,
        logContext,
      );
    }
  }
}
