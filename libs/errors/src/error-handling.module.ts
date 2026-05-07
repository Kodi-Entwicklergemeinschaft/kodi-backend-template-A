import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ErrorReportingService } from './error-reporting.service';
import { I18nModule } from '@kodi/i18n';

@Global()
@Module({
  imports: [I18nModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    ErrorReportingService,
  ],
  exports: [ErrorReportingService],
})
export class ErrorHandlingModule {}
