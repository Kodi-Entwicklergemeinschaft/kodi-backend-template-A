import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService, ChildLogger } from '@kodi/logger';
import { ConfigService } from '@kodi/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly structuredLogger: ChildLogger;
  private readonly serviceName: string;

  constructor(
    loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.structuredLogger = loggerService.createChildLogger({
      operation: 'http-request',
    });
    this.serviceName = this.configService.get<string>('serviceName', 'kodi-service');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const startTime = Date.now();

    // Log incoming request
    this.structuredLogger.log('Incoming request', {
      service: this.serviceName,
      method,
      url,
      body: this.sanitizeBody(body),
      userAgent: headers['user-agent'],
      ip: request.ip,
    });

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          // Log successful response
          this.structuredLogger.log('Request completed', {
            service: this.serviceName,
            method,
            url,
            statusCode: response.statusCode,
            duration,
            durationMs: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          // Log error response
          this.structuredLogger.error('Request failed', error, {
            service: this.serviceName,
            method,
            url,
            duration,
            durationMs: `${duration}ms`,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
