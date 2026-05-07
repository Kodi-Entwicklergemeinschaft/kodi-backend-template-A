import { Injectable, Inject } from '@nestjs/common';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';
import { firstValueFrom, timeout } from 'rxjs';
import { DEFAULT_EMAIL_THEME, CityEmailTheme } from '../config/default-email-theme.config';

/**
 * Default city key used when no cityId is provided
 * This city's theme will be used for emails without a specific city context
 */
const DEFAULT_CITY_KEY = 'kodi';

@Injectable()
export class CityEmailThemeService {
  private readonly themeCache: Map<string, CityEmailTheme> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly cacheTimestamps: Map<string, number> = new Map();

  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(CityEmailThemeService.name);
  }

  /**
   * Get city email theme configuration
   * If no cityId is provided, fetches the default city (Kodi) by key
   * Falls back to DEFAULT_EMAIL_THEME if city not found or theme not configured
   */
  async getCityTheme(cityId?: string | null): Promise<CityEmailTheme> {
    // If no cityId provided, try to fetch the default city by key
    if (!cityId) {
      this.logger.debug(`No cityId provided, fetching default city: ${DEFAULT_CITY_KEY}`);
      return this.getDefaultCityTheme();
    }

    // Check cache first
    const cachedTheme = this.getCachedTheme(cityId);
    if (cachedTheme) {
      this.logger.debug(`Using cached theme for city: ${cityId}`);
      return cachedTheme;
    }

    try {
      // Fetch city data via RabbitMQ
      const city = await firstValueFrom(
        this.client
          .send<any, { id: string }>(RabbitMQPatterns.CITY_FIND_BY_ID, { id: cityId })
          .pipe(timeout(5000)),
      );

      if (!city) {
        this.logger.warn(`City not found: ${cityId}, using default theme`);
        return DEFAULT_EMAIL_THEME;
      }

      // Parse city metadata to extract email theme
      const theme = this.parseCityMetadata(city.metadata);

      // Cache the theme
      this.cacheTheme(cityId, theme);

      this.logger.debug(`Loaded theme for city: ${cityId}`);
      return theme;
    } catch (error) {
      this.logger.warn(`Failed to fetch city theme for ${cityId}, using default theme`, error);
      return DEFAULT_EMAIL_THEME;
    }
  }

  /**
   * Parse city metadata to extract email theme configuration
   */
  private parseCityMetadata(metadata: any): CityEmailTheme {
    if (!metadata || typeof metadata !== 'object') {
      return DEFAULT_EMAIL_THEME;
    }

    const emailTheme = metadata.emailTheme;
    if (!emailTheme || typeof emailTheme !== 'object') {
      return DEFAULT_EMAIL_THEME;
    }

    // Merge with default theme, ensuring all required fields are present
    const theme: CityEmailTheme = {
      appName: emailTheme.appName || DEFAULT_EMAIL_THEME.appName,
      appNameDisplay:
        emailTheme.appNameDisplay || emailTheme.appName || DEFAULT_EMAIL_THEME.appNameDisplay,
      primaryColor: emailTheme.primaryColor || DEFAULT_EMAIL_THEME.primaryColor,
      secondaryColor: emailTheme.secondaryColor || DEFAULT_EMAIL_THEME.secondaryColor,
      accentColor:
        emailTheme.accentColor || emailTheme.primaryColor || DEFAULT_EMAIL_THEME.accentColor,
      greetingKey: emailTheme.greetingKey || DEFAULT_EMAIL_THEME.greetingKey,
      logoUrl: emailTheme.logoUrl || DEFAULT_EMAIL_THEME.logoUrl,
      logoWidth: emailTheme.logoWidth || DEFAULT_EMAIL_THEME.logoWidth,
      logoHeight: emailTheme.logoHeight || DEFAULT_EMAIL_THEME.logoHeight,
      emailTheme: {
        headerBackgroundColor:
          emailTheme.emailTheme?.headerBackgroundColor ||
          emailTheme.secondaryColor ||
          DEFAULT_EMAIL_THEME.emailTheme?.headerBackgroundColor ||
          DEFAULT_EMAIL_THEME.secondaryColor,
        footerBackgroundColor:
          emailTheme.emailTheme?.footerBackgroundColor ||
          emailTheme.primaryColor ||
          DEFAULT_EMAIL_THEME.emailTheme?.footerBackgroundColor ||
          DEFAULT_EMAIL_THEME.primaryColor,
        buttonColor:
          emailTheme.emailTheme?.buttonColor ||
          DEFAULT_EMAIL_THEME.emailTheme?.buttonColor ||
          '#ffffff',
        buttonTextColor:
          emailTheme.emailTheme?.buttonTextColor ||
          emailTheme.primaryColor ||
          DEFAULT_EMAIL_THEME.emailTheme?.buttonTextColor ||
          DEFAULT_EMAIL_THEME.primaryColor,
      },
    };

    return theme;
  }

  /**
   * Get cached theme if still valid
   */
  private getCachedTheme(cityId: string): CityEmailTheme | null {
    const cached = this.themeCache.get(cityId);
    const timestamp = this.cacheTimestamps.get(cityId);

    if (!cached || !timestamp) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - timestamp > this.CACHE_TTL) {
      this.themeCache.delete(cityId);
      this.cacheTimestamps.delete(cityId);
      return null;
    }

    return cached;
  }

  /**
   * Cache theme for a city
   */
  private cacheTheme(cityId: string, theme: CityEmailTheme): void {
    this.themeCache.set(cityId, theme);
    this.cacheTimestamps.set(cityId, Date.now());
  }

  /**
   * Clear cache for a specific city (useful when city is updated)
   */
  clearCache(cityId: string): void {
    this.themeCache.delete(cityId);
    this.cacheTimestamps.delete(cityId);
    this.logger.debug(`Cleared theme cache for city: ${cityId}`);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.themeCache.clear();
    this.cacheTimestamps.clear();
    this.logger.debug('Cleared all theme cache');
  }

  /**
   * Get the default city theme by fetching the city with key = DEFAULT_CITY_KEY (e.g., 'kodi')
   * This is used when no cityId is provided in registration or password reset
   */
  private async getDefaultCityTheme(): Promise<CityEmailTheme> {
    // Use a special cache key for the default city
    const cacheKey = `__default__${DEFAULT_CITY_KEY}`;

    // Check cache first
    const cachedTheme = this.getCachedTheme(cacheKey);
    if (cachedTheme) {
      this.logger.debug(`Using cached theme for default city: ${DEFAULT_CITY_KEY}`);
      return cachedTheme;
    }

    try {
      // Fetch city data by key via RabbitMQ
      const city = await firstValueFrom(
        this.client
          .send<any, { key: string }>(RabbitMQPatterns.CITY_FIND_BY_KEY, { key: DEFAULT_CITY_KEY })
          .pipe(timeout(5000)),
      );

      if (!city) {
        this.logger.warn(
          `Default city not found: ${DEFAULT_CITY_KEY}, using hardcoded default theme`,
        );
        return DEFAULT_EMAIL_THEME;
      }

      // Parse city metadata to extract email theme
      const theme = this.parseCityMetadata(city.metadata);

      // Cache the theme with the special key
      this.cacheTheme(cacheKey, theme);

      this.logger.debug(`Loaded theme for default city: ${DEFAULT_CITY_KEY}`);
      return theme;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch default city theme for ${DEFAULT_CITY_KEY}, using hardcoded default`,
        error,
      );
      return DEFAULT_EMAIL_THEME;
    }
  }
}
