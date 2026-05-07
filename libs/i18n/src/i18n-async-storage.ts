import { AsyncLocalStorage } from 'async_hooks';
import { I18nContext } from './interfaces/translation.interface';

/**
 * AsyncLocalStorage instance for i18n context
 * Similar to asyncLocalStorage in logger service
 */
export const i18nAsyncLocalStorage = new AsyncLocalStorage<I18nContext>();
