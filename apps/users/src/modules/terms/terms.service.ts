import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaUsersService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { ConfigService } from '@kodi/config';
import { CreateTermsDto, UpdateTermsDto, AcceptTermsDto } from '@kodi/contracts';

@Injectable()
export class TermsService {
  private readonly logger: LoggerService;
  private readonly defaultLocale: string;
  private readonly defaultGracePeriodDays: number;

  constructor(
    private readonly prisma: PrismaUsersService,
    private readonly configService: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(TermsService.name);
    this.defaultLocale = this.configService.get<string>('terms.defaultLocale', 'en');
    this.defaultGracePeriodDays = this.configService.get<number>('terms.gracePeriodDays', 7);
  }

  /**
   * Get the latest active terms of use
   * If cityId is provided, prefers city-specific terms, otherwise uses general terms (cityId = null)
   * Falls back to default locale if requested locale is not found
   */
  async getLatestTerms(locale?: string, cityId?: string | null): Promise<any> {
    const targetLocale = locale || this.defaultLocale;

    // If cityId is provided, try to get city-specific terms first
    if (cityId) {
      const cityTerms = await this.prisma.termsOfUse.findFirst({
        where: {
          isActive: true,
          isLatest: true,
          locale: targetLocale,
          cityId: cityId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (cityTerms) {
        return cityTerms;
      }

      // Try city-specific terms in default locale
      if (targetLocale !== this.defaultLocale) {
        const cityTermsDefault = await this.prisma.termsOfUse.findFirst({
          where: {
            isActive: true,
            isLatest: true,
            locale: this.defaultLocale,
            cityId: cityId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (cityTermsDefault) {
          this.logger.warn(
            `No city terms found for locale: ${targetLocale}, falling back to ${this.defaultLocale}`,
          );
          return cityTermsDefault;
        }
      }
    }

    // Fall back to general terms (cityId = null)
    let generalTerms = await this.prisma.termsOfUse.findFirst({
      where: {
        isActive: true,
        isLatest: true,
        locale: targetLocale,
        cityId: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fallback to default locale if requested locale not found
    if (!generalTerms && targetLocale !== this.defaultLocale) {
      this.logger.warn(
        `No terms found for locale: ${targetLocale}, falling back to ${this.defaultLocale}`,
      );
      generalTerms = await this.prisma.termsOfUse.findFirst({
        where: {
          isActive: true,
          isLatest: true,
          locale: this.defaultLocale,
          cityId: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (!generalTerms) {
      throw new NotFoundException(`No active terms of use found for locale: ${targetLocale}`);
    }

    return generalTerms;
  }

  /**
   * Get terms by version, locale, and optionally cityId
   * If cityId is provided, looks for city-specific terms, otherwise general terms
   */
  async getTermsByVersion(version: string, locale?: string, cityId?: string | null): Promise<any> {
    const targetLocale = locale || this.defaultLocale;

    // Try city-specific first if cityId provided
    if (cityId) {
      const cityTerms = await this.prisma.termsOfUse.findUnique({
        where: {
          version_locale_cityId: {
            version,
            locale: targetLocale,
            cityId: cityId,
          },
        },
      });

      if (cityTerms) {
        return cityTerms;
      }
    }

    // Fall back to general terms (use findFirst for nullable cityId)
    const generalTerms = await this.prisma.termsOfUse.findFirst({
      where: {
        version,
        locale: targetLocale,
        cityId: null,
      },
    });

    if (!generalTerms) {
      throw new NotFoundException(
        `Terms version ${version} not found for locale: ${targetLocale}${cityId ? ` and city: ${cityId}` : ''}`,
      );
    }

    return generalTerms;
  }

  /**
   * Check if user has accepted the latest terms
   * If cityId is provided, checks city-specific terms first, then general terms
   *
   * NOTE: Acceptance is VERSION-based, not locale-based. If user accepted v2024-01 in English,
   * they don't need to re-accept in German. This allows users to switch app language
   * without being prompted to re-accept terms they've already agreed to.
   */
  async hasUserAcceptedLatestTerms(
    userId: string,
    locale?: string,
    cityId?: string | null,
  ): Promise<{ hasAccepted: boolean; termsId: string | null; gracePeriodEndsAt: Date | null }> {
    const targetLocale = locale || this.defaultLocale;

    // Get latest terms (prefers city-specific if cityId provided)
    const latestTerms = await this.getLatestTerms(targetLocale, cityId).catch(() => null);

    if (!latestTerms) {
      // No terms defined yet, allow access
      return { hasAccepted: true, termsId: null, gracePeriodEndsAt: null };
    }

    // Check if user has accepted this VERSION (any locale) for the same cityId context
    // This way, accepting terms in one language covers all languages for that version
    const acceptance = await this.prisma.userTermsAcceptance.findFirst({
      where: {
        userId,
        version: latestTerms.version,
        // Also consider cityId context: if latestTerms is city-specific, check city-specific acceptance
        // If latestTerms is general (cityId null), check general acceptance
        terms: {
          cityId: latestTerms.cityId,
        },
      },
    });

    if (acceptance) {
      return { hasAccepted: true, termsId: latestTerms.id, gracePeriodEndsAt: null };
    }

    // Check if within grace period
    const gracePeriodEndsAt = this.isWithinGracePeriod(latestTerms)
      ? new Date(
          new Date(latestTerms.createdAt).getTime() +
            latestTerms.gracePeriodDays * 24 * 60 * 60 * 1000,
        )
      : null;

    return {
      hasAccepted: false,
      termsId: latestTerms.id,
      gracePeriodEndsAt,
    };
  }

  /**
   * Get user's accepted terms version
   */
  async getUserAcceptedVersion(userId: string): Promise<string | null> {
    const acceptance = await this.prisma.userTermsAcceptance.findFirst({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
      include: { terms: true },
    });

    return acceptance?.terms.version || null;
  }

  /**
   * Check if terms are within grace period
   */
  private isWithinGracePeriod(terms: any): boolean {
    const now = new Date();
    const createdAt = new Date(terms.createdAt);
    const gracePeriodEnd = new Date(
      createdAt.getTime() + terms.gracePeriodDays * 24 * 60 * 60 * 1000,
    );

    return now < gracePeriodEnd;
  }

  /**
   * Accept terms of use
   * Acceptance is VERSION-based - accepting in any language covers all languages for that version
   */
  async acceptTerms(
    userId: string,
    dto: AcceptTermsDto,
    _userLocale?: string, // Kept for API compatibility, but not used since acceptance is version-based
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    // First, get the terms by ID
    const terms = await this.prisma.termsOfUse.findUnique({
      where: { id: dto.termsId },
    });

    if (!terms) {
      throw new NotFoundException('Terms of use not found');
    }

    if (!terms.isActive) {
      throw new BadRequestException('These terms are no longer active');
    }

    // Check if user has already accepted this VERSION (any locale, same cityId context)
    // This ensures accepting terms once covers all languages for that version
    const existingVersionAcceptance = await this.prisma.userTermsAcceptance.findFirst({
      where: {
        userId,
        version: terms.version,
        terms: {
          cityId: terms.cityId,
        },
      },
      include: {
        terms: {
          select: {
            id: true,
            version: true,
            title: true,
            locale: true,
          },
        },
      },
    });

    if (existingVersionAcceptance) {
      this.logger.debug(
        `User ${userId} already accepted terms version ${terms.version} in locale ${existingVersionAcceptance.locale}`,
      );
      return existingVersionAcceptance; // Already accepted this version
    }

    // Create acceptance record with the terms' locale (what they're actually accepting)
    const acceptance = await this.prisma.userTermsAcceptance.create({
      data: {
        userId,
        termsId: terms.id,
        version: terms.version,
        locale: terms.locale, // Store the actual terms locale being accepted
        ipAddress,
        userAgent,
      },
      include: {
        terms: {
          select: {
            id: true,
            version: true,
            title: true,
            locale: true,
          },
        },
      },
    });

    this.logger.log(
      `User ${userId} accepted terms version ${terms.version} (locale: ${terms.locale})`,
    );
    return acceptance;
  }

  /**
   * Create new terms version (Admin only)
   * cityId is optional - null for general terms, specific ID for city-specific terms
   */
  async createTerms(
    dto: CreateTermsDto & { cityId?: string | null },
    createdBy?: string,
  ): Promise<any> {
    const cityId = dto.cityId ?? null;

    // Check if version+locale+cityId already exists
    // Use findFirst for nullable cityId to avoid type issues
    const existing = await this.prisma.termsOfUse.findFirst({
      where: {
        version: dto.version,
        locale: dto.locale,
        cityId: cityId,
      },
    });

    if (existing) {
      const termsType = cityId ? `city ${cityId}` : 'general';
      throw new BadRequestException(
        `Terms version ${dto.version} already exists for locale ${dto.locale} (${termsType} terms)`,
      );
    }

    // If this is marked as latest, unmark all others for this locale+cityId combination
    if (dto.isLatest) {
      await this.prisma.termsOfUse.updateMany({
        where: {
          isLatest: true,
          locale: dto.locale,
          cityId: cityId,
        },
        data: { isLatest: false },
      });
    }

    const terms = await this.prisma.termsOfUse.create({
      data: {
        version: dto.version,
        title: dto.title,
        content: dto.content,
        locale: dto.locale,
        cityId: cityId,
        isActive: dto.isActive ?? true,
        isLatest: dto.isLatest ?? false,
        gracePeriodDays: dto.gracePeriodDays ?? this.defaultGracePeriodDays,
        createdBy,
      },
    });

    const termsType = cityId ? `city ${cityId}` : 'general';
    this.logger.log(
      `Created new ${termsType} terms version ${dto.version} for locale ${dto.locale}`,
    );
    return terms;
  }

  /**
   * Update terms (Admin only)
   */
  async updateTerms(termsId: string, dto: UpdateTermsDto): Promise<any> {
    const terms = await this.prisma.termsOfUse.findUnique({
      where: { id: termsId },
    });

    if (!terms) {
      throw new NotFoundException('Terms of use not found');
    }

    // If setting as latest, unmark all others for this locale+cityId combination
    if (dto.isLatest === true) {
      await this.prisma.termsOfUse.updateMany({
        where: {
          isLatest: true,
          locale: terms.locale,
          cityId: terms.cityId,
          id: { not: termsId },
        },
        data: { isLatest: false },
      });
    }

    const updated = await this.prisma.termsOfUse.update({
      where: { id: termsId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isLatest !== undefined && { isLatest: dto.isLatest }),
        ...(dto.gracePeriodDays !== undefined && {
          gracePeriodDays: dto.gracePeriodDays,
        }),
      },
    });

    this.logger.log(`Updated terms ${termsId}`);
    return updated;
  }

  /**
   * Get all terms versions (Admin only)
   */
  async getAllTerms(locale?: string): Promise<any[]> {
    const where: any = {};
    if (locale) {
      where.locale = locale;
    }

    return this.prisma.termsOfUse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { acceptances: true },
        },
      },
    });
  }

  /**
   * Get terms acceptance status for user
   */
  async getAcceptanceStatus(userId: string, locale?: string): Promise<any> {
    const targetLocale = locale || this.defaultLocale;

    // Check actual acceptance status for all users (including guests)
    const acceptanceCheck = await this.hasUserAcceptedLatestTerms(userId, targetLocale);
    const acceptedVersion = await this.getUserAcceptedVersion(userId);
    const latestTerms = await this.getLatestTerms(targetLocale).catch(() => null);

    return {
      hasAccepted: acceptanceCheck.hasAccepted,
      acceptedVersion,
      latestVersion: latestTerms?.version || null,
      needsAcceptance: !acceptanceCheck.hasAccepted,
      termsId: latestTerms?.id || null,
      gracePeriodEndsAt: acceptanceCheck.gracePeriodEndsAt
        ? acceptanceCheck.gracePeriodEndsAt.toISOString()
        : null,
    };
  }
}
