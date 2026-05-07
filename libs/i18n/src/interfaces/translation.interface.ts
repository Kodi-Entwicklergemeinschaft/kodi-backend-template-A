/**
 * I18n Context interface for AsyncLocalStorage
 */
export interface I18nContext {
  language: string; // ISO 639-1 code (e.g., 'en', 'de')
  locale?: string; // Full locale (e.g., 'en-US')
}

/**
 * Translation file structure
 */
export interface TranslationFile {
  [key: string]: string | TranslationFile;
}

/**
 * Supported languages type
 */
export type SupportedLanguage = 'de' | 'en' | 'dk' | 'no' | 'se' | 'ar' | 'fa' | 'tr' | 'ru' | 'uk';
