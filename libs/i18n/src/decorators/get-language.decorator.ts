import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { i18nAsyncLocalStorage } from '../i18n-async-storage';

/**
 * Parameter decorator to inject current language from AsyncLocalStorage
 * Usage: @GetLanguage() language: string
 */
export const GetLanguage = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string => {
    const context = i18nAsyncLocalStorage.getStore();
    return context?.language || 'en';
  },
);
