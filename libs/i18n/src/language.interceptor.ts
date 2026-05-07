import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { LanguageDetectorService } from './language-detector.service';
import { i18nAsyncLocalStorage } from './i18n-async-storage';
import { I18nContext } from './interfaces/translation.interface';

/**
 * Key for storing i18n context on the request object.
 * This provides a reliable way to access language context that works
 * even when AsyncLocalStorage doesn't propagate through RxJS pipelines.
 */
export const I18N_CONTEXT_KEY = '__i18nContext';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LanguageInterceptor.name);

  constructor(private readonly languageDetector: LanguageDetectorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const acceptLanguage = request.headers['accept-language'];

    // Detect language from Accept-Language header
    const language = this.languageDetector.detectLanguage(acceptLanguage);

    this.logger.debug(`Accept-Language header: ${acceptLanguage}, detected language: ${language}`);

    // Create i18n context
    const i18nContext: I18nContext = {
      language,
      locale: acceptLanguage ? this.extractLocale(acceptLanguage) : undefined,
    };

    // Store context on request object for reliable access by other interceptors
    // This is necessary because AsyncLocalStorage doesn't propagate through RxJS Observable pipelines
    (request as any)[I18N_CONTEXT_KEY] = i18nContext;

    // Also set context in AsyncLocalStorage for backwards compatibility
    return new Observable((subscriber) => {
      i18nAsyncLocalStorage.run(i18nContext, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      });
    });
  }

  /**
   * Extract locale from Accept-Language header
   * @param acceptLanguage Accept-Language header value
   * @returns Full locale string (e.g., 'en-US') or undefined
   */
  private extractLocale(acceptLanguage: string): string | undefined {
    // Get the first language tag (before comma)
    const firstTag = acceptLanguage.split(',')[0].trim();
    // Return full locale if it contains hyphen (e.g., 'en-US')
    return firstTag.includes('-') ? firstTag : undefined;
  }
}
