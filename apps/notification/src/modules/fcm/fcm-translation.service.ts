import { Injectable, Inject } from '@nestjs/common';
import { I18nService } from '@kodi/i18n';
import { ConfigService } from '@kodi/config';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';
import { SendNotificationDto } from '@kodi/contracts';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class FCMTranslationService {
  private readonly logger: LoggerService;
  private readonly defaultLanguage: string;

  constructor(
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(FCMTranslationService.name);
    this.defaultLanguage = this.configService.pushNotificationDefaultLanguage;
    this.logger.log(
      `FCMTranslationService initialized with defaultLanguage: ${this.defaultLanguage}`,
    );
  }

  /**
   * Resolve language priority: user.preferredLanguage → system default
   */
  resolveLanguage(user: any): string {
    // Check user.preferredLanguage (from database)
    if (user?.preferredLanguage && typeof user.preferredLanguage === 'string') {
      this.logger.debug(`Using user preferred language: ${user.preferredLanguage}`);
      return user.preferredLanguage;
    }

    // Use system default (from PUSH_NOTIFICATION_DEFAULT_LANGUAGE env var)
    this.logger.debug(
      `User has no preferred language (value: ${user?.preferredLanguage}), using default: ${this.defaultLanguage}`,
    );
    return this.defaultLanguage;
  }

  /**
   * Translate notification using translation key
   * Always passes language explicitly to prevent fallback to i18n service default
   */
  translateNotification(key: string, params?: Record<string, any>, language?: string): string {
    // Ensure language is always passed to prevent fallback to 'en'
    const lang = language || this.defaultLanguage;
    return this.i18nService.translate(key, params, lang);
  }

  /**
   * Get notification content (title and body) with translation support
   */
  async getNotificationContent(
    dto: SendNotificationDto,
    user: any,
  ): Promise<{ title: string; body: string }> {
    const language = this.resolveLanguage(user);

    this.logger.debug(
      `getNotificationContent - userId: ${user?.id}, resolvedLanguage: ${language}, translationKey: ${dto.translationKey || 'none'}`,
    );

    // If translation key is provided, use translation
    if (dto.translationKey) {
      // Build translation params with user data and provided params
      const translationParams = await this.buildTranslationParams(
        dto.translationParams || {},
        user,
        dto.cityId,
      );

      // For notifications, translation key should point to a base key (e.g., notifications.welcome)
      // We'll get both title and body from the base key
      // If key already includes .title or .body, extract the base
      let baseKey = dto.translationKey;
      if (baseKey.endsWith('.title') || baseKey.endsWith('.body')) {
        baseKey = baseKey.replace(/\.(title|body)$/, '');
      }

      // Get title and body from the base key
      const titleKey = `${baseKey}.title`;
      const bodyKey = `${baseKey}.body`;

      const title = this.translateNotification(titleKey, translationParams, language);
      const body = this.translateNotification(bodyKey, translationParams, language);

      this.logger.debug(
        `Translated notification - key: ${baseKey}, language: ${language}, title: "${title.substring(0, 50)}..."`,
      );

      return { title, body };
    }

    // Fallback to provided subject/content or use generic translation
    if (dto.subject && dto.content) {
      return {
        title: dto.subject,
        body: dto.content,
      };
    }

    // Use generic translation with provided content
    const translationParams = await this.buildTranslationParams(
      {
        ...(dto.translationParams || {}),
        subject: dto.subject || '',
        content: dto.content || '',
      },
      user,
      dto.cityId,
    );

    return {
      title: this.translateNotification('notifications.generic.title', translationParams, language),
      body: this.translateNotification('notifications.generic.body', translationParams, language),
    };
  }

  /**
   * Build translation parameters from user data and provided params
   */
  private async buildTranslationParams(
    providedParams: Record<string, any>,
    user: any,
    cityId?: string,
  ): Promise<Record<string, any>> {
    const params: Record<string, any> = {
      ...providedParams,
    };

    // Add user data
    if (user?.firstName) {
      params.firstName = user.firstName;
    }
    if (user?.lastName) {
      params.lastName = user.lastName;
    }

    // Add city name if cityId is provided
    if (cityId) {
      try {
        const city = await firstValueFrom(
          this.client
            .send<any, { id: string }>(RabbitMQPatterns.CITY_FIND_BY_ID, { id: cityId })
            .pipe(timeout(5000)),
        );
        if (city?.name) {
          params.cityName = city.name;
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch city name for cityId: ${cityId}`, error);
      }
    }

    // Add app name (can be from city theme or default)
    // For now, use default app name - can be enhanced later with city theme
    if (!params.appName) {
      params.appName = 'Kodi';
    }

    return params;
  }
}
