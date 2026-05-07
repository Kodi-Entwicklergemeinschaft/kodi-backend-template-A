import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { Prisma, UserRole, SubServiceItemType } from '@prisma/client-core';
import {
  CreateTileDto,
  TileCityReferenceDto,
  TileFilterDto,
  TileResponseDto,
  TileCityDto,
  UpdateTileDto,
  TileSortDirection,
  SendTopicNotificationDto,
} from '@kodi/contracts';
import { UserContextService } from '@kodi/rbac';
import { StorageService } from '@kodi/storage';
import { ConfigService } from '@kodi/config';
import { RedisService } from '@kodi/redis';
import { TranslationService } from '@kodi/translations';
import { I18nService } from '@kodi/i18n';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';

const tileWithRelations = Prisma.validator<Prisma.TileDefaultArgs>()({
  include: {
    cities: true,
  },
});

type TileWithRelations = Prisma.TileGetPayload<typeof tileWithRelations>;

/** Context to build FCM topic payloads after the DB transaction commits. */
type TileBroadcastContext = {
  tileId: string;
  header: string;
  subheader: string | null;
  sourceLocale: string;
  cityTargets: (string | undefined)[];
};

function optionalTileHexOrNull(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value;
}

@Injectable()
export class TilesService {
  private static readonly CACHE_PREFIX_TILES = 'tiles:list:';
  private static readonly CACHE_TTL_TILES = 600; // 10 minutes
  /** Base FCM topic; per-locale topics are `${base}_${locale}` (e.g. warnings_de). */
  private static readonly TILE_TOPIC_BROADCAST_BASE = 'warnings';

  /**
   * FCM topic suffixes must match mobile app subscriptions (ISO-style: da, sv).
   * Translation rows and DeepL use internal codes dk / se — see tileTranslationLocale().
   */
  private static readonly TILE_FCM_TOPIC_LOCALES = [
    'en',
    'de',
    'ar',
    'da',
    'fa',
    'no',
    'ru',
    'sv',
    'tr',
    'uk',
  ] as const;

  /** Map app / FCM locale → locale stored in translations + passed to DeepL (dk, se). */
  private tileTranslationLocale(locale: string): string {
    const lower = locale.toLowerCase();
    if (lower === 'da') {
      return 'dk';
    }
    if (lower === 'sv') {
      return 'se';
    }
    return lower;
  }

  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly logger: LoggerService,
    private readonly userContext: UserContextService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly translationService: TranslationService,
    private readonly i18nService: I18nService,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
  ) {
    this.logger.setContext(TilesService.name);
  }

  private isAdmin(roles: UserRole[] = []) {
    return roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.CITY_ADMIN);
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Extract pathname and remove leading slash and bucket name
      // Format: /bucket-name/tiles/tileId/background.webp
      const pathname = urlObj.pathname;
      // Remove leading slash and first segment (bucket name)
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 1) {
        return parts.slice(1).join('/');
      }
      return pathname.replace(/^\/[^\/]+\//, '');
    } catch (error) {
      this.logger.warn(`Failed to parse URL: ${url}`, error);
      // Fallback: try to extract from pathname directly
      return url.split('?')[0].replace(/^https?:\/\/[^\/]+\//, '');
    }
  }

  /** Any CategorySubService row with this tile as itemType TILE (active or inactive). */
  private async isTileLinkedAsSubService(tileId: string): Promise<boolean> {
    const row = await this.prisma.categorySubService.findFirst({
      where: { itemType: SubServiceItemType.TILE, itemId: tileId },
      select: { id: true },
    });
    return !!row;
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async ensureUniqueSlug(baseSlug: string, currentId?: string) {
    let candidate = baseSlug;
    let counter = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.tile.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing || existing.id === currentId) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter++}`;
    }
  }

  private mapTile(tile: TileWithRelations, subServices: boolean): TileResponseDto {
    return {
      id: tile.id,
      slug: tile.slug,
      backgroundImageUrl: tile.backgroundImageUrl,
      iconImageUrl: tile.iconImageUrl,
      headerBackgroundColor: tile.headerBackgroundColor,
      header: tile.header,
      subheader: tile.subheader,
      description: tile.description,
      contentBackgroundColor: tile.contentBackgroundColor,
      websiteUrl: tile.websiteUrl,
      openInExternalBrowser: tile.openInExternalBrowser,
      displayOrder: tile.displayOrder,
      isActive: tile.isActive,
      sendNotification: tile.sendNotification,
      subServices,
      publishAt: tile.publishAt?.toISOString() ?? null,
      expireAt: tile.expireAt?.toISOString() ?? null,
      createdByUserId: tile.createdByUserId,
      lastEditedByUserId: tile.lastEditedByUserId,
      createdAt: tile.createdAt.toISOString(),
      updatedAt: tile.updatedAt.toISOString(),
      cities: tile.cities.map<TileCityDto>((city) => ({
        id: city.id,
        cityId: city.cityId,
        isPrimary: city.isPrimary,
        displayOrder: city.displayOrder,
      })),
    };
  }

  /**
   * Apply translations to tile fields based on current request language
   */
  private async applyTileTranslations(
    tile: TileWithRelations,
    dto: TileResponseDto,
  ): Promise<TileResponseDto> {
    const locale = this.i18nService.getLanguage();

    // Get source language from tile (the language the tile content is stored in)
    const sourceLocale =
      tile.languageCode || this.configService.get<string>('i18n.defaultLanguage', 'en');

    // Skip translation if no locale requested or if requested locale matches the tile's source language
    if (!locale || locale === sourceLocale) {
      return dto;
    }

    const [header, subheader, description] = await Promise.all([
      this.translationService.getTranslation(
        'tile',
        tile.id,
        'header',
        locale,
        dto.header,
        sourceLocale,
      ),
      this.translationService.getTranslation(
        'tile',
        tile.id,
        'subheader',
        locale,
        dto.subheader ?? '',
        sourceLocale,
      ),
      this.translationService.getTranslation(
        'tile',
        tile.id,
        'description',
        locale,
        dto.description ?? '',
        sourceLocale,
      ),
    ]);

    return {
      ...dto,
      header,
      subheader,
      description,
    };
  }

  /**
   * Locales used in FCM topic names (`warnings_<code>`). Order matches mobile.
   * Override: comma-separated `I18N_FCM_TILE_TOPIC_LOCALES` (see `i18n.fcmTileTopicLocales`).
   */
  private getFcmTileTopicLocales(): string[] {
    const fromConfig = this.configService.get<string[]>('i18n.fcmTileTopicLocales');
    if (fromConfig?.length) {
      return fromConfig;
    }
    return [...TilesService.TILE_FCM_TOPIC_LOCALES];
  }

  /**
   * Resolve tile header/subheader for push copy in a target locale (same rules as API tile translations).
   * Ensures non-empty body for FCM / validators when subheader is blank.
   */
  private async resolveTilePushCopyForLocale(
    tileId: string,
    header: string,
    subheader: string | null,
    sourceLocale: string,
    targetLocale: string,
  ): Promise<{ title: string; body: string }> {
    let title = header;
    let sub = subheader ?? '';

    if (targetLocale !== sourceLocale) {
      [title, sub] = await Promise.all([
        this.translationService.getTranslation(
          'tile',
          tileId,
          'header',
          targetLocale,
          header,
          sourceLocale,
        ),
        this.translationService.getTranslation(
          'tile',
          tileId,
          'subheader',
          targetLocale,
          subheader ?? '',
          sourceLocale,
        ),
      ]);
    }

    const body = sub.trim().length > 0 ? sub : title;
    return { title, body };
  }

  /**
   * One FCM message per (city Firebase project × supported locale). Topics: warnings_{locale}.
   *
   * On first-time broadcast for a tile (or when the source text changed) we synchronously
   * translate the header/subheader into every non-source supported locale via DeepL before
   * emitting, so subscribers never receive untranslated source text. `autoTranslate` is
   * hash-aware and idempotent, so subsequent broadcasts are no-ops (only DB reads).
   */
  private async buildTileTopicNotificationPayloads(
    ctx: TileBroadcastContext,
  ): Promise<SendTopicNotificationDto[]> {
    const fcmLocales = this.getFcmTileTopicLocales();
    const sourceTranslationLocale = this.tileTranslationLocale(ctx.sourceLocale);
    const translationTargets = [
      ...new Set(
        fcmLocales
          .map((fcm) => this.tileTranslationLocale(fcm))
          .filter((t) => t !== sourceTranslationLocale),
      ),
    ];

    if (translationTargets.length > 0) {
      try {
        await this.translationService.autoTranslate(
          'tile',
          ctx.tileId,
          'header',
          sourceTranslationLocale,
          translationTargets,
          ctx.header,
        );
      } catch (error) {
        this.logger.error(
          `Tile header auto-translate failed; will fall back to source text per missing locale`,
          error,
        );
      }

      const subheaderText = ctx.subheader ?? '';
      if (subheaderText.trim().length > 0) {
        try {
          await this.translationService.autoTranslate(
            'tile',
            ctx.tileId,
            'subheader',
            sourceTranslationLocale,
            translationTargets,
            subheaderText,
          );
        } catch (error) {
          this.logger.error(
            `Tile subheader auto-translate failed; will fall back to source text per missing locale`,
            error,
          );
        }
      }
    }

    const payloads: SendTopicNotificationDto[] = [];

    for (const cityId of ctx.cityTargets) {
      for (const fcmLocale of fcmLocales) {
        const translationLocale = this.tileTranslationLocale(fcmLocale);
        const { title, body } = await this.resolveTilePushCopyForLocale(
          ctx.tileId,
          ctx.header,
          ctx.subheader,
          sourceTranslationLocale,
          translationLocale,
        );

        payloads.push({
          topic: `${TilesService.TILE_TOPIC_BROADCAST_BASE}_${fcmLocale}`,
          title,
          body,
          fcmData: {
            kind: 'tile',
            tileId: ctx.tileId,
            locale: fcmLocale,
          },
          cityId,
        });
      }
    }

    return payloads;
  }

  /**
   * Batch translate a list of tiles. One DB query for all translations.
   */
  private async applyTileTranslationsBatch(
    tiles: Array<{ tile: TileWithRelations; dto: TileResponseDto }>,
  ): Promise<TileResponseDto[]> {
    const locale = this.i18nService.getLanguage();
    if (!locale) {
      return tiles.map(({ dto }) => dto);
    }

    const defaultLang = this.configService.get<string>('i18n.defaultLanguage', 'en');

    // Collect entities that need translation
    const entities: Array<{ entityType: string; entityId: string }> = [];
    for (const { tile } of tiles) {
      const sourceLocale = tile.languageCode || defaultLang;
      if (locale !== sourceLocale) {
        entities.push({ entityType: 'tile', entityId: tile.id });
      }
    }

    const translationMap = await this.translationService.prefetchTranslations(entities, locale);

    return tiles.map(({ tile, dto }) => {
      const sourceLocale = tile.languageCode || defaultLang;
      if (locale === sourceLocale) return dto;

      return {
        ...dto,
        header: this.translationService.getTranslationFromMap(
          translationMap,
          'tile',
          tile.id,
          'header',
          locale,
          dto.header,
          sourceLocale,
        ),
        subheader: this.translationService.getTranslationFromMap(
          translationMap,
          'tile',
          tile.id,
          'subheader',
          locale,
          dto.subheader ?? '',
          sourceLocale,
        ),
        description: this.translationService.getTranslationFromMap(
          translationMap,
          'tile',
          tile.id,
          'description',
          locale,
          dto.description ?? '',
          sourceLocale,
        ),
      };
    });
  }

  private async syncTileCities(
    tx: Prisma.TransactionClient,
    tileId: string,
    cities?: TileCityReferenceDto[],
  ) {
    if (cities === undefined) {
      return;
    }

    if (!cities.length) {
      await tx.tileCity.deleteMany({ where: { tileId } });
      return;
    }

    const cityIds = cities.map((city) => city.cityId);

    await tx.tileCity.deleteMany({
      where: {
        tileId,
        cityId: {
          notIn: cityIds,
        },
      },
    });

    await Promise.all(
      cities.map((city, index) =>
        tx.tileCity.upsert({
          where: {
            tileId_cityId: {
              tileId,
              cityId: city.cityId,
            },
          },
          update: {
            isPrimary: city.isPrimary ?? index === 0,
            displayOrder: city.displayOrder ?? index,
          },
          create: {
            ...(city.id ? { id: city.id } : {}),
            tileId,
            cityId: city.cityId,
            isPrimary: city.isPrimary ?? index === 0,
            displayOrder: city.displayOrder ?? index,
          },
        }),
      ),
    );
  }

  async createTile(
    userId: string,
    roles: UserRole[],
    dto: CreateTileDto,
  ): Promise<TileResponseDto> {
    if (!this.isAdmin(roles)) {
      throw new ForbiddenException('Only admins can create tiles');
    }

    // Validate city access for CITY_ADMIN
    if (roles.includes(UserRole.CITY_ADMIN) && !roles.includes(UserRole.SUPER_ADMIN)) {
      if (!dto.cities || dto.cities.length === 0) {
        throw new ForbiddenException('City admins must specify at least one city');
      }

      const managedCities = await this.userContext.getUserManagedCities(userId);
      const requestedCityIds = dto.cities.map((c) => c.cityId);

      // If managedCities is empty, user is SUPER_ADMIN (shouldn't happen here, but check anyway)
      if (managedCities.length > 0) {
        const hasAccess = requestedCityIds.every((cityId) => managedCities.includes(cityId));
        if (!hasAccess) {
          throw new ForbiddenException(
            'You do not have access to create tiles for one or more specified cities',
          );
        }
      }
    }

    // Generate slug from header (slug is auto-generated, not provided during creation)
    const baseSlug = this.slugify(dto.header) || this.slugify(`tile-${Date.now()}`);
    const slug = await this.ensureUniqueSlug(baseSlug);

    // Determine source language: use current request language or default
    const sourceLanguage =
      this.i18nService.getLanguage() ||
      this.configService.get<string>('i18n.defaultLanguage', 'en');

    const data: Prisma.TileCreateInput = {
      slug,
      headerBackgroundColor: optionalTileHexOrNull(dto.headerBackgroundColor),
      header: dto.header,
      subheader: dto.subheader,
      description: dto.description,
      contentBackgroundColor: optionalTileHexOrNull(dto.contentBackgroundColor),
      websiteUrl: dto.websiteUrl,
      openInExternalBrowser: dto.openInExternalBrowser ?? false,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? false,
      sendNotification: dto.sendNotification ?? false,
      languageCode: sourceLanguage,
      // publishAt and expireAt are not set during creation
      createdByUserId: userId,
      lastEditedByUserId: userId,
      cities: dto.cities?.length
        ? {
            create: dto.cities.map((city, index) => ({
              // id is not provided during creation (TileCity IDs are auto-generated)
              cityId: city.cityId,
              isPrimary: city.isPrimary ?? index === 0,
              displayOrder: city.displayOrder ?? index,
            })),
          }
        : undefined,
    };

    const tile = await this.prisma.tile.create({
      data,
      include: tileWithRelations.include,
    });

    await this.invalidateTileCache();
    const tileDto = this.mapTile(tile, false);
    return this.applyTileTranslations(tile, tileDto);
  }

  async updateTile(
    tileId: string,
    userId: string,
    roles: UserRole[],
    dto: UpdateTileDto,
  ): Promise<TileResponseDto> {
    if (!this.isAdmin(roles)) {
      throw new ForbiddenException('Only admins can update tiles');
    }

    const { tileResult, broadcastContext } = await this.prisma.$transaction(async (tx) => {
      let broadcastContext: TileBroadcastContext | null = null;
      const existing = await tx.tile.findUnique({
        where: { id: tileId },
        include: { cities: true },
      });

      if (!existing) {
        throw new NotFoundException('Tile not found');
      }

      // Validate city access for CITY_ADMIN
      if (roles.includes(UserRole.CITY_ADMIN) && !roles.includes(UserRole.SUPER_ADMIN)) {
        const managedCities = await this.userContext.getUserManagedCities(userId);

        // Check access to existing cities
        if (existing.cities.length > 0) {
          const existingCityIds = existing.cities.map((c) => c.cityId);
          if (managedCities.length > 0) {
            const hasAccess = existingCityIds.every((cityId) => managedCities.includes(cityId));
            if (!hasAccess) {
              throw new ForbiddenException('You do not have access to update this tile');
            }
          }
        }

        // Check access to new cities if being updated
        if (dto.cities && dto.cities.length > 0) {
          const requestedCityIds = dto.cities.map((c) => c.cityId);
          if (managedCities.length > 0) {
            const hasAccess = requestedCityIds.every((cityId) => managedCities.includes(cityId));
            if (!hasAccess) {
              throw new ForbiddenException(
                'You do not have access to assign tiles to one or more specified cities',
              );
            }
          }
        }
      }

      const updateData: Prisma.TileUpdateInput = {
        lastEditedByUserId: userId,
      };

      if (dto.slug !== undefined) {
        const slug = await this.ensureUniqueSlug(this.slugify(dto.slug), tileId);
        updateData.slug = slug;
      }

      if (dto.headerBackgroundColor !== undefined) {
        updateData.headerBackgroundColor = optionalTileHexOrNull(dto.headerBackgroundColor) ?? null;
      }

      if (dto.header !== undefined) {
        updateData.header = dto.header;
      }

      if (dto.subheader !== undefined) {
        updateData.subheader = dto.subheader;
      }

      if (dto.description !== undefined) {
        updateData.description = dto.description;
      }

      if (dto.contentBackgroundColor !== undefined) {
        updateData.contentBackgroundColor =
          optionalTileHexOrNull(dto.contentBackgroundColor) ?? null;
      }

      if (dto.websiteUrl !== undefined) {
        updateData.websiteUrl = dto.websiteUrl;
      }

      if (dto.openInExternalBrowser !== undefined) {
        updateData.openInExternalBrowser = dto.openInExternalBrowser;
      }

      if (dto.displayOrder !== undefined) {
        updateData.displayOrder = dto.displayOrder;
      }

      if (dto.isActive !== undefined) {
        updateData.isActive = dto.isActive;
      }

      if (dto.publishAt !== undefined) {
        updateData.publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
      }

      if (dto.expireAt !== undefined) {
        updateData.expireAt = dto.expireAt ? new Date(dto.expireAt) : null;
      }

      if (dto.sendNotification !== undefined) {
        updateData.sendNotification = dto.sendNotification;
      }

      // Update languageCode from Accept-Language header
      const sourceLanguage =
        this.i18nService.getLanguage() ||
        this.configService.get<string>('i18n.defaultLanguage', 'en');
      updateData.languageCode = sourceLanguage;

      await tx.tile.update({
        where: { id: tileId },
        data: updateData,
      });

      await this.syncTileCities(tx, tileId, dto.cities);

      const refreshed = await tx.tile.findUnique({
        where: { id: tileId },
        include: tileWithRelations.include,
      });

      if (!refreshed) {
        throw new NotFoundException('Tile not found after update');
      }

      // Prepare broadcast context when the tile is active (per spec: triggered on activation).
      // Detailed emissions are persisted after commit (see tile_notification_logs.emissions).
      if (
        dto.broadcastNotification === true &&
        refreshed.sendNotification === true &&
        refreshed.isActive === true
      ) {
        // FCM topics are scoped per Firebase project. Since a tile can be
        // attached to multiple cities (each with its own Firebase project),
        // we fan out one emission per city so devices subscribed to the topic
        // in each city's project receive the notification.
        // If the tile has no cities attached, emit once without a cityId so
        // the notification service falls back to the default Firebase project.
        const cityTargets: (string | undefined)[] =
          refreshed.cities.length > 0 ? refreshed.cities.map((c) => c.cityId) : [undefined];

        const sourceLocale =
          refreshed.languageCode || this.configService.get<string>('i18n.defaultLanguage', 'en');

        broadcastContext = {
          tileId: refreshed.id,
          header: refreshed.header,
          subheader: refreshed.subheader,
          sourceLocale,
          cityTargets,
        };
      }

      const subServices = !!(await tx.categorySubService.findFirst({
        where: { itemType: SubServiceItemType.TILE, itemId: refreshed.id },
        select: { id: true },
      }));
      const tileDto = this.mapTile(refreshed, subServices);
      const tileResult = await this.applyTileTranslations(refreshed, tileDto);
      return { tileResult, broadcastContext };
    });

    const notificationPayloads = broadcastContext
      ? await this.buildTileTopicNotificationPayloads(broadcastContext)
      : [];

    await this.invalidateTileCache();

    if (notificationPayloads.length > 0 && broadcastContext) {
      try {
        await this.prisma.tileNotificationLog.create({
          data: {
            tileId: broadcastContext.tileId,
            topic: TilesService.TILE_TOPIC_BROADCAST_BASE,
            title: broadcastContext.header,
            body: broadcastContext.subheader ?? '',
            emissions: notificationPayloads.map((p) => ({
              topic: p.topic,
              title: p.title,
              body: p.body,
              cityId: p.cityId ?? null,
              fcmData: p.fcmData ?? {},
            })),
          },
        });
      } catch (error) {
        this.logger.error('Failed to persist tile broadcast emissions log', error);
      }
    }

    // Emit fire-and-forget AFTER transaction commits so the message is only
    // sent when the DB write succeeded.
    for (const payload of notificationPayloads) {
      this.client.emit(RabbitMQPatterns.NOTIFICATION_SEND_TOPIC, payload);
      this.logger.log(
        `Broadcast notification emitted for tile on topic '${payload.topic}' (cityId: ${payload.cityId ?? 'default'}, locale: ${payload.fcmData?.locale ?? 'n/a'})`,
      );
    }

    return tileResult;
  }

  async getTileById(tileId: string): Promise<TileResponseDto> {
    const tile = await this.prisma.tile.findUnique({
      where: { id: tileId },
      include: tileWithRelations.include,
    });

    if (!tile) {
      throw new NotFoundException('Tile not found');
    }

    const subServices = await this.isTileLinkedAsSubService(tile.id);
    const dto = this.mapTile(tile, subServices);
    return this.applyTileTranslations(tile, dto);
  }

  async getTileBySlug(slug: string): Promise<TileResponseDto> {
    const tile = await this.prisma.tile.findUnique({
      where: { slug },
      include: tileWithRelations.include,
    });

    if (!tile) {
      throw new NotFoundException('Tile not found');
    }

    const subServices = await this.isTileLinkedAsSubService(tile.id);
    const dto = this.mapTile(tile, subServices);
    return this.applyTileTranslations(tile, dto);
  }

  /**
   * SQL WHERE for tile list — must stay aligned with {@link buildTileWhere} and
   * listTiles include/exclude id rules (category sub-services).
   */
  private buildTileListWhereSql(
    filter: TileFilterDto,
    includeTileIds: string[] | null,
    excludeTileIds: string[] | null,
  ): Prisma.Sql {
    if (includeTileIds !== null && includeTileIds.length === 0) {
      return Prisma.sql`FALSE`;
    }

    const parts: Prisma.Sql[] = [];

    if (filter.search?.trim()) {
      const term = `%${filter.search.trim()}%`;
      parts.push(
        Prisma.sql`(t."header" ILIKE ${term} OR t."subheader" ILIKE ${term} OR t."description" ILIKE ${term})`,
      );
    }

    if (filter.cityIds?.length) {
      parts.push(
        Prisma.sql`EXISTS (
          SELECT 1 FROM "tile_cities" tc
          WHERE tc."tileId" = t."id" AND tc."cityId" IN (${Prisma.join(
            filter.cityIds.map((id) => Prisma.sql`${id}`),
          )})
        )`,
      );
    }

    if (filter.isActive !== undefined) {
      parts.push(Prisma.sql`t."isActive" = ${filter.isActive}`);
    }

    if (filter.publishAfter) {
      parts.push(Prisma.sql`t."publishAt" >= ${new Date(filter.publishAfter)}`);
    }
    if (filter.publishBefore) {
      parts.push(Prisma.sql`t."publishAt" <= ${new Date(filter.publishBefore)}`);
    }

    if (filter.expireAfter) {
      parts.push(Prisma.sql`t."expireAt" >= ${new Date(filter.expireAfter)}`);
    }
    if (filter.expireBefore) {
      parts.push(Prisma.sql`t."expireAt" <= ${new Date(filter.expireBefore)}`);
    }

    if (includeTileIds !== null && includeTileIds.length > 0) {
      parts.push(
        Prisma.sql`t."id" IN (${Prisma.join(includeTileIds.map((id) => Prisma.sql`${id}`))})`,
      );
    }
    if (excludeTileIds !== null && excludeTileIds.length > 0) {
      parts.push(
        Prisma.sql`t."id" NOT IN (${Prisma.join(excludeTileIds.map((id) => Prisma.sql`${id}`))})`,
      );
    }

    if (parts.length === 0) {
      return Prisma.sql`TRUE`;
    }
    return Prisma.join(parts, ' AND ');
  }

  private buildTileWhere(filter: TileFilterDto = {} as TileFilterDto): Prisma.TileWhereInput {
    const where: Prisma.TileWhereInput = {};
    const andConditions: Prisma.TileWhereInput[] = [];

    // Search filter - search in header, subheader, and description
    if (filter.search) {
      const searchTerm = filter.search.trim();
      if (searchTerm) {
        andConditions.push({
          OR: [
            { header: { contains: searchTerm, mode: 'insensitive' } },
            { subheader: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        });
      }
    }

    if (filter.cityIds?.length) {
      where.cities = {
        some: {
          cityId: {
            in: filter.cityIds,
          },
        },
      };
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.publishAfter || filter.publishBefore) {
      andConditions.push({
        publishAt: {
          ...(filter.publishAfter ? { gte: new Date(filter.publishAfter) } : {}),
          ...(filter.publishBefore ? { lte: new Date(filter.publishBefore) } : {}),
        },
      });
    }

    if (filter.expireAfter || filter.expireBefore) {
      andConditions.push({
        expireAt: {
          ...(filter.expireAfter ? { gte: new Date(filter.expireAfter) } : {}),
          ...(filter.expireBefore ? { lte: new Date(filter.expireBefore) } : {}),
        },
      });
    }

    if (andConditions.length) {
      where.AND = andConditions;
    }

    return where;
  }

  async listTiles(filter: TileFilterDto = {} as TileFilterDto) {
    // Check cache
    const locale = this.i18nService.getLanguage() || 'default';
    const cacheKey = `${TilesService.CACHE_PREFIX_TILES}${locale}:${JSON.stringify(filter)}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const pageSizeCandidate = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : 20;
    const pageSize = Math.min(pageSizeCandidate, 100);
    const skip = (page - 1) * pageSize;

    let includeTileIds: string[] | null = null;
    let excludeTileIds: string[] | null = null;

    if (filter.categoryId) {
      const subServiceRecords = await this.prisma.categorySubService.findMany({
        where: { categoryId: filter.categoryId, itemType: SubServiceItemType.TILE, isActive: true },
        select: { itemId: true },
      });
      includeTileIds = subServiceRecords.map((r) => r.itemId);
    } else {
      const subServiceTileRecords = await this.prisma.categorySubService.findMany({
        where: { itemType: SubServiceItemType.TILE, isActive: true },
        select: { itemId: true },
      });
      const excludeIds = subServiceTileRecords.map((r) => r.itemId);
      if (excludeIds.length > 0) {
        excludeTileIds = excludeIds;
      }
    }

    const where = this.buildTileWhere(filter);

    if (filter.categoryId) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { id: { in: includeTileIds! } },
      ];
    } else if (excludeTileIds?.length) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { id: { notIn: excludeTileIds } },
      ];
    }

    const allowedSortFields = new Set(['createdAt', 'updatedAt', 'publishAt', 'displayOrder']);
    const sortByField =
      filter.sortBy && allowedSortFields.has(filter.sortBy) ? filter.sortBy : 'displayOrder';
    const sortDirection = filter.sortDirection ?? TileSortDirection.ASC;

    let rows: TileWithRelations[];
    let total: number;

    if (sortByField === 'displayOrder') {
      const whereSql = this.buildTileListWhereSql(filter, includeTileIds, excludeTileIds);
      const displayDir =
        sortDirection === TileSortDirection.ASC ? Prisma.raw('ASC') : Prisma.raw('DESC');

      const [idRows, countRows] = await Promise.all([
        this.prisma.$queryRaw<{ id: string }[]>`
          SELECT t."id" FROM "tiles" t
          WHERE ${whereSql}
          ORDER BY
            (CASE
              WHEN EXISTS (
                SELECT 1 FROM "category_sub_services" css
                WHERE css."itemId" = t."id"
                  AND css."itemType" = 'TILE'::"SubServiceItemType"
                  AND css."isActive" = true
              ) THEN 0
              WHEN t."sendNotification" THEN 1
              ELSE 0
            END) DESC,
            t."displayOrder" ${displayDir},
            t."id" ASC
          LIMIT ${pageSize} OFFSET ${skip}
        `,
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint AS count FROM "tiles" t WHERE ${whereSql}
        `,
      ]);
      total = Number(countRows[0].count);
      const pageIds = idRows.map((r) => r.id);
      const rowsUnordered =
        pageIds.length > 0
          ? await this.prisma.tile.findMany({
              where: { id: { in: pageIds } },
              include: tileWithRelations.include,
            })
          : [];
      const orderIndex = new Map(pageIds.map((id, index) => [id, index]));
      rows = rowsUnordered.sort((a, b) => orderIndex.get(a.id)! - orderIndex.get(b.id)!);
    } else {
      const orderBy: Prisma.TileOrderByWithRelationInput = {};
      (orderBy as Record<string, unknown>)[sortByField] = sortDirection;
      const [dbRows, count] = await Promise.all([
        this.prisma.tile.findMany({
          where,
          include: tileWithRelations.include,
          orderBy,
          skip,
          take: pageSize,
        }),
        this.prisma.tile.count({ where }),
      ]);
      rows = dbRows;
      total = count;
    }

    const tileIds = rows.map((r) => r.id);
    const linkedRows =
      tileIds.length > 0
        ? await this.prisma.categorySubService.findMany({
            where: { itemType: SubServiceItemType.TILE, itemId: { in: tileIds } },
            select: { itemId: true },
          })
        : [];
    const linkedAsSubService = new Set(linkedRows.map((r) => r.itemId));

    const items = await this.applyTileTranslationsBatch(
      rows.map((row) => ({
        tile: row,
        dto: this.mapTile(row, linkedAsSubService.has(row.id)),
      })),
    );
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const result = {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
    await this.redis.set(cacheKey, result, TilesService.CACHE_TTL_TILES);
    return result;
  }

  /**
   * Invalidate all cached tile lists.
   */
  private async invalidateTileCache(): Promise<void> {
    try {
      await this.redis.delPattern(`${TilesService.CACHE_PREFIX_TILES}*`);
    } catch (err) {
      this.logger.warn(`Failed to invalidate tile cache: ${err}`);
    }
  }

  async deleteTile(
    tileId: string,
    userId: string,
    roles: UserRole[],
  ): Promise<{ message: string }> {
    if (!this.isAdmin(roles)) {
      throw new ForbiddenException('Only admins can delete tiles');
    }

    const existing = await this.prisma.tile.findUnique({
      where: { id: tileId },
      include: { cities: true },
    });

    if (!existing) {
      throw new NotFoundException('Tile not found');
    }

    // Validate city access for CITY_ADMIN
    if (roles.includes(UserRole.CITY_ADMIN) && !roles.includes(UserRole.SUPER_ADMIN)) {
      const managedCities = await this.userContext.getUserManagedCities(userId);
      if (existing.cities.length > 0) {
        const existingCityIds = existing.cities.map((c) => c.cityId);
        if (managedCities.length > 0) {
          const hasAccess = existingCityIds.every((cityId) => managedCities.includes(cityId));
          if (!hasAccess) {
            throw new ForbiddenException('You do not have access to delete this tile');
          }
        }
      }
    }

    // Delete background image from storage if exists
    if (existing.backgroundImageUrl) {
      try {
        const key = this.extractKeyFromUrl(existing.backgroundImageUrl);
        const bucket = this.configService.storageConfig.defaultBucket;
        if (bucket) {
          await this.storageService.deleteFile({ bucket, key });
        }
      } catch (error) {
        this.logger.warn(`Failed to delete background image for tile ${tileId}`, error);
        // Don't fail the delete operation if file cleanup fails
      }
    }

    // Delete icon image from storage if exists
    if (existing.iconImageUrl) {
      try {
        const key = this.extractKeyFromUrl(existing.iconImageUrl);
        const bucket = this.configService.storageConfig.defaultBucket;
        if (bucket) {
          await this.storageService.deleteFile({ bucket, key });
        }
      } catch (error) {
        this.logger.warn(`Failed to delete icon image for tile ${tileId}`, error);
        // Don't fail the delete operation if file cleanup fails
      }
    }

    await this.prisma.tile.delete({
      where: { id: tileId },
    });

    await this.invalidateTileCache();
    return { message: 'Tile deleted successfully' };
  }
}
