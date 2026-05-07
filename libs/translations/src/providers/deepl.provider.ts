import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@kodi/config';
import { LoggerService } from '@kodi/logger';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ITranslationProvider } from './translation-provider.interface';
import { RateLimitError } from '../errors/rate-limit.error';

interface DeepLTranslationResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

/**
 * Language code mapping from internal codes to DeepL API codes
 */
const DEEPL_LANGUAGE_MAP: Record<string, string> = {
  de: 'DE',
  en: 'EN',
  dk: 'DA', // Danish (internal)
  da: 'DA', // Danish (ISO 639-1; FCM topic suffix used by mobile)
  no: 'NB', // Norwegian Bokmål
  se: 'SV', // Swedish (internal)
  sv: 'SV', // Swedish (ISO 639-1; FCM topic suffix used by mobile)
  ar: 'AR',
  fa: 'FA',
  tr: 'TR',
  ru: 'RU',
  uk: 'UK',
};

@Injectable()
export class DeepLProvider implements ITranslationProvider {
  private readonly logger: LoggerService;
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(DeepLProvider.name);

    this.apiKey = this.configService.get<string>('translations.deepl.apiKey', '');
    this.apiUrl =
      this.configService.get<string>('translations.deepl.apiUrl') ||
      'https://api-free.deepl.com/v2/translate';
    this.maxRetries = parseInt(
      this.configService.get<string>('translations.deepl.maxRetries', '3'),
      10,
    );
    this.retryDelayMs = parseInt(
      this.configService.get<string>('translations.deepl.retryDelayMs', '1000'),
      10,
    );

    if (!this.apiKey) {
      this.logger.warn('DeepL API key not configured. Translation provider will fail.');
    }
  }

  /**
   * Map internal language code to DeepL language code
   */
  private mapLanguageCode(locale: string): string {
    const mapped = DEEPL_LANGUAGE_MAP[locale.toLowerCase()];
    if (!mapped) {
      this.logger.warn(`Unsupported language code for DeepL: ${locale}, using as-is`);
      return locale.toUpperCase();
    }
    return mapped;
  }

  /**
   * Extract Retry-After header value from error response
   */
  private extractRetryAfter(error: AxiosError): number | undefined {
    const retryAfter = error.response?.headers['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds) && seconds > 0) {
        return seconds * 1000; // Convert to milliseconds
      }
    }
    return undefined;
  }

  /**
   * Check if error is a rate limit error (HTTP 429)
   */
  private isRateLimitError(error: any): boolean {
    if (error instanceof AxiosError) {
      return error.response?.status === 429;
    }
    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * DeepL deprecated the auth_key form field (Jan 2026). Use Authorization header instead.
   * @see https://developers.deepl.com/docs/getting-started/auth
   */
  private getDeepLRequestHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `DeepL-Auth-Key ${this.apiKey}`,
    };
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(retryCount: number, retryAfter?: number): number {
    if (retryAfter) {
      // Use Retry-After header if provided, with some jitter
      const jitter = Math.random() * 0.1 * retryAfter; // 0-10% jitter
      return retryAfter + jitter;
    }
    // Exponential backoff: baseDelay * 2^retryCount with jitter
    const baseDelay = this.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
    return exponentialDelay + jitter;
  }

  /**
   * Translate a single text string with retry logic
   */
  async translate(text: string, targetLocale: string, sourceLocale?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DeepL API key is not configured');
    }

    const targetLang = this.mapLanguageCode(targetLocale);
    const sourceLang = sourceLocale ? this.mapLanguageCode(sourceLocale) : undefined;

    let lastError: any;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const params = new URLSearchParams({
          text,
          target_lang: targetLang,
          // Enable DeepL beta languages (e.g. FA for Persian) as per docs:
          // https://developers.deepl.com/docs/getting-started/supported-languages
          enable_beta_languages: '1',
        });

        if (sourceLang) {
          params.append('source_lang', sourceLang);
        }

        const response = await firstValueFrom(
          this.http.post<DeepLTranslationResponse>(this.apiUrl, params, {
            headers: this.getDeepLRequestHeaders(),
            timeout: 30000,
          }),
        );

        if (response.data.translations && response.data.translations.length > 0) {
          return response.data.translations[0].text;
        }

        throw new Error('No translation returned from DeepL API');
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        if (this.isRateLimitError(error) && retryCount < this.maxRetries) {
          const retryAfter = this.extractRetryAfter(error as AxiosError);
          const delay = this.calculateBackoffDelay(retryCount, retryAfter);

          this.logger.warn(
            `DeepL rate limit hit (429). Retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${this.maxRetries})`,
          );

          await this.sleep(delay);
          retryCount++;
          continue;
        }

        // If not a rate limit error, or max retries reached, throw
        if (this.isRateLimitError(error)) {
          const retryAfter = this.extractRetryAfter(error as AxiosError);
          this.logger.error(
            `DeepL translation failed after ${retryCount} retries: ${error?.message}`,
            error?.stack,
          );
          throw new RateLimitError(
            `DeepL translation rate limited after ${retryCount} retries: ${error?.message || 'Unknown error'}`,
            429,
            retryAfter,
            retryCount,
            error,
          );
        }

        // For non-rate-limit errors, throw immediately
        this.logger.error(`DeepL translation failed: ${error?.message}`, error?.stack);
        throw new Error(`DeepL translation failed: ${error?.message || 'Unknown error'}`);
      }
    }

    // Should not reach here, but handle just in case
    throw new Error(
      `DeepL translation failed after ${retryCount} attempts: ${lastError?.message || 'Unknown error'}`,
    );
  }

  /**
   * Translate multiple texts in a single batch to the same target locale with retry logic
   */
  async translateBatch(
    texts: string[],
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('DeepL API key is not configured');
    }

    if (texts.length === 0) {
      return [];
    }

    const targetLang = this.mapLanguageCode(targetLocale);
    const sourceLang = sourceLocale ? this.mapLanguageCode(sourceLocale) : undefined;

    let lastError: any;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const params = new URLSearchParams({
          target_lang: targetLang,
          // Enable DeepL beta languages (e.g. FA for Persian) as per docs:
          // https://developers.deepl.com/docs/getting-started/supported-languages
          enable_beta_languages: '1',
        });

        // Add all texts as separate parameters (DeepL supports multiple text parameters)
        texts.forEach((text) => {
          params.append('text', text);
        });

        if (sourceLang) {
          params.append('source_lang', sourceLang);
        }

        const response = await firstValueFrom(
          this.http.post<DeepLTranslationResponse>(this.apiUrl, params, {
            headers: this.getDeepLRequestHeaders(),
            timeout: 30000,
          }),
        );

        if (response.data.translations && response.data.translations.length === texts.length) {
          return response.data.translations.map((t) => t.text);
        }

        throw new Error(
          `Expected ${texts.length} translations, got ${response.data.translations?.length || 0}`,
        );
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        if (this.isRateLimitError(error) && retryCount < this.maxRetries) {
          const retryAfter = this.extractRetryAfter(error as AxiosError);
          const delay = this.calculateBackoffDelay(retryCount, retryAfter);

          this.logger.warn(
            `DeepL batch translation rate limit hit (429). Retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${this.maxRetries})`,
          );

          await this.sleep(delay);
          retryCount++;
          continue;
        }

        // If not a rate limit error, or max retries reached, throw
        if (this.isRateLimitError(error)) {
          const retryAfter = this.extractRetryAfter(error as AxiosError);
          this.logger.error(
            `DeepL batch translation failed after ${retryCount} retries: ${error?.message}`,
            error?.stack,
          );
          throw new RateLimitError(
            `DeepL batch translation rate limited after ${retryCount} retries: ${error?.message || 'Unknown error'}`,
            429,
            retryAfter,
            retryCount,
            error,
          );
        }

        // For non-rate-limit errors, throw immediately
        this.logger.error(`DeepL batch translation failed: ${error?.message}`, error?.stack);
        throw new Error(`DeepL batch translation failed: ${error?.message || 'Unknown error'}`);
      }
    }

    // Should not reach here, but handle just in case
    throw new Error(
      `DeepL batch translation failed after ${retryCount} attempts: ${lastError?.message || 'Unknown error'}`,
    );
  }
}
