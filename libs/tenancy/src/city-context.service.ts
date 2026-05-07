import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface CityContext {
  cityId?: string;
  cityIds?: string[];
}

@Injectable()
export class CityContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<CityContext>();

  /**
   * Get the current city ID from context
   */
  getCityId(): string | undefined {
    const context = this.asyncLocalStorage.getStore();
    return context?.cityId;
  }

  /**
   * Set the current city ID in context
   */
  setCityId(cityId: string): void {
    const context = this.asyncLocalStorage.getStore();
    if (context) {
      context.cityId = cityId;
    }
  }

  /**
   * Get all city IDs the user has access to
   */
  getCityIds(): string[] | undefined {
    const context = this.asyncLocalStorage.getStore();
    return context?.cityIds;
  }

  /**
   * Set all city IDs the user has access to
   */
  setCityIds(cityIds: string[]): void {
    const context = this.asyncLocalStorage.getStore();
    if (context) {
      context.cityIds = cityIds;
    }
  }

  /**
   * Run a function within a city context
   */
  run<T>(context: CityContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  /**
   * Clear the city context
   */
  clear(): void {
    // AsyncLocalStorage doesn't have a clear method,
    // context is automatically cleared when the async context ends
  }

  /**
   * Get the full context
   */
  getContext(): CityContext | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
