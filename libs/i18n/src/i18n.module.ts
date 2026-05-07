import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@kodi/config';
import { I18nService } from './i18n.service';
import { LanguageDetectorService } from './language-detector.service';
import { LanguageInterceptor } from './language.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [I18nService, LanguageDetectorService, LanguageInterceptor],
  exports: [I18nService, LanguageDetectorService, LanguageInterceptor],
})
export class I18nModule {}
