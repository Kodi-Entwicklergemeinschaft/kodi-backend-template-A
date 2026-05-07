/**
 * Interface for translation providers (e.g., DeepL, Google Translate, etc.)
 */
export interface ITranslationProvider {
  /**
   * Translate a single text string
   * @param text - Text to translate
   * @param targetLocale - Target language code
   * @param sourceLocale - Optional source language code (for better accuracy)
   * @returns Translated text
   */
  translate(text: string, targetLocale: string, sourceLocale?: string): Promise<string>;

  /**
   * Translate multiple texts in a single batch
   * @param texts - Array of texts to translate
   * @param targetLocale - Target language code
   * @param sourceLocale - Optional source language code
   * @returns Array of translated texts in the same order
   */
  translateBatch(texts: string[], targetLocale: string, sourceLocale?: string): Promise<string[]>;
}
