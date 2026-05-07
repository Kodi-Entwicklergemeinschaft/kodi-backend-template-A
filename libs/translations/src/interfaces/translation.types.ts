/**
 * Translation source types
 */
export enum TranslationSource {
  MANUAL = 'MANUAL',
  AUTO_DEEPL = 'AUTO_DEEPL',
  IMPORT = 'IMPORT',
}

/**
 * Entity types that can be translated
 */
export type EntityType = 'listing' | 'city' | 'category' | 'tile' | string;

/**
 * Translation context for entity-based translations
 */
export interface TranslationContext {
  entityType: string;
  entityId: string;
  field: string;
  locale: string;
}

/**
 * Translation target configuration
 */
export interface TranslationTarget {
  locale: string;
  sourceLocale?: string;
}
