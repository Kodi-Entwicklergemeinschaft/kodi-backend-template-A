import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { I18nService } from '@kodi/i18n';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  constructor(private readonly i18nService: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Enhanced validation error formatting
        if (error.name === 'ValidationError' || error.status === 400) {
          const formattedError = this.formatValidationError(error);
          return throwError(() => new BadRequestException(formattedError));
        }
        return throwError(() => error);
      }),
    );
  }

  private formatValidationError(error: any) {
    const validationErrorKey = this.i18nService.translate('errors.VALIDATION_ERROR');
    const fallbackMessage =
      validationErrorKey !== 'errors.VALIDATION_ERROR' ? validationErrorKey : 'Validation failed';

    if (error.response?.message && Array.isArray(error.response.message)) {
      const formattedErrors = error.response.message.map((msg: string) => {
        const field = this.extractField(msg);
        // Try to translate the message if it's a translation key
        let translatedMessage = msg;

        // Check if message is a translation key (format: "validation.key" or just "key")
        if (msg.startsWith('validation.') || !msg.includes(' ')) {
          // Try to translate as validation key
          const key = msg.startsWith('validation.') ? msg : `validation.${msg}`;
          translatedMessage = this.i18nService.translate(key, { field });

          // If translation didn't work, use original message
          if (translatedMessage === key) {
            translatedMessage = msg;
          }
        } else {
          // If it's a regular message, try to extract and translate common patterns
          const match = msg.match(/^(.*?)\s(must be|is required|should)/i);
          if (match) {
            const fieldName = match[1];
            // Try common validation keys
            if (msg.includes('must be a valid email')) {
              translatedMessage = this.i18nService.translate('validation.email', {
                field: fieldName || 'field',
              });
            } else if (msg.includes('is required')) {
              translatedMessage = this.i18nService.translate('validation.required', {
                field: fieldName || 'field',
              });
            } else if (msg.includes('must be at least') && msg.includes('characters')) {
              const minMatch = msg.match(/at least (\d+)/);
              const min = minMatch ? minMatch[1] : '6';
              translatedMessage = this.i18nService.translate('validation.minLength', {
                field: fieldName || 'field',
                min,
              });
            }

            // If translation didn't work, use original message
            if (translatedMessage.startsWith('validation.') || translatedMessage === msg) {
              translatedMessage = msg;
            }
          }
        }

        return {
          field,
          message: translatedMessage,
        };
      });

      // Use the first error message as the main message instead of generic "Validation failed"
      const mainMessage = formattedErrors.length > 0 ? formattedErrors[0].message : fallbackMessage;

      return {
        message: mainMessage,
        errors: formattedErrors,
      };
    }

    return {
      message: fallbackMessage,
      errors: [],
    };
  }

  private extractField(message: string): string {
    // Try to extract field name from validation message
    const match = message.match(/^(\w+)\s/);
    return match ? match[1] : 'unknown';
  }
}
