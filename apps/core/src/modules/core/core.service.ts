import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { RedisService } from '@kodi/redis';
import { LoggerService } from '@kodi/logger';
import { PrismaCoreService } from '@kodi/prisma';
import { TranslationService } from '@kodi/translations';
import { ConfigService } from '@kodi/config';
import { I18nService } from '@kodi/i18n';
import {
  UserRole,
  ListingStatus,
  ListingModerationStatus,
  ListingSourceType,
  ListingVisibility,
  ListingRecurrenceFreq,
  Prisma,
  CategoryType,
  ListingReminderType,
} from '@prisma/client-core';
import {
  CoreOperationRequestDto,
  CoreOperationResponseDto,
  SendNotificationDto,
} from '@kodi/contracts';
import { roleToNumber } from '@kodi/rbac';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class CoreService implements OnModuleInit {
  private readonly defaultSourceLocale: string;
  private readonly supportedLocales: string[];
  private readonly translatableFields = ['title', 'summary', 'description'];

  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly redis: RedisService,
    private readonly prisma: PrismaCoreService,
    private readonly translationService: TranslationService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly i18nService: I18nService,
  ) {
    this.logger.setContext(CoreService.name);
    this.defaultSourceLocale = this.configService.get<string>(
      'translations.defaultSourceLocale',
      'en',
    );
    this.supportedLocales = this.configService.get<string[]>('i18n.supportedLanguages') || [
      'de',
      'en',
      'dk',
      'no',
      'se',
      'ar',
      'fa',
      'tr',
      'ru',
      'uk',
    ];
  }

  async onModuleInit() {
    this.logger.log('Core service initialized - listening to events');
  }

  async getStatus() {
    const cachedStatus = await this.redis.get('core:status');
    if (cachedStatus) {
      return cachedStatus;
    }

    const status = {
      service: 'core',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
    };

    await this.redis.set('core:status', status, 30);
    return status;
  }

  async executeOperation(dto: CoreOperationRequestDto): Promise<CoreOperationResponseDto> {
    this.logger.log(`Queueing operation: ${dto.operation}`);

    this.client.emit(RabbitMQPatterns.CORE_OPERATION, {
      operation: dto.operation,
      payload: dto.payload ?? {},
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Operation queued for execution',
      operationId: Date.now().toString(),
    };
  }

  /**
   * Clean up all user-related data when account is permanently deleted
   * This includes favorites, reminders, and city assignments
   */
  async cleanupUserData(userId: string) {
    this.logger.log(`Cleaning up user data for userId: ${userId}`);

    // Delete user favorites
    const deletedFavorites = await this.prisma.userFavorite.deleteMany({
      where: { userId },
    });
    this.logger.log(`Deleted ${deletedFavorites.count} favorites for user: ${userId}`);

    // Delete listing reminders
    const deletedReminders = await this.prisma.listingReminder.deleteMany({
      where: { userId },
    });
    this.logger.log(`Deleted ${deletedReminders.count} reminders for user: ${userId}`);

    // Delete city assignments
    const deletedAssignments = await this.prisma.userCityAssignment.deleteMany({
      where: { userId },
    });
    this.logger.log(`Deleted ${deletedAssignments.count} city assignments for user: ${userId}`);

    return {
      deletedFavorites: deletedFavorites.count,
      deletedReminders: deletedReminders.count,
      deletedAssignments: deletedAssignments.count,
    };
  }

  async getUserAssignments(userId: string, role?: string) {
    this.logger.log(`Getting user assignments for userId: ${userId}, role: ${role || 'all'}`);

    const assignments = await this.prisma.userCityAssignment.findMany({
      where: {
        userId,
        isActive: true,
        ...(role && { role: role as UserRole }),
      },
      select: {
        id: true,
        cityId: true,
        role: true,
        canManageAdmins: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assignments.map((assignment) => ({
      cityId: assignment.cityId,
      role: assignment.role,
      canManageAdmins: assignment.canManageAdmins,
      createdAt: assignment.createdAt,
    }));
  }

  async getUserCities(userId: string) {
    this.logger.log(`Getting cities for userId: ${userId}`);

    const assignments = await this.prisma.userCityAssignment.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        cityId: true,
      },
    });

    return assignments.map((assignment) => assignment.cityId);
  }

  async createUserCityAssignment(userId: string, cityId: string, role: string) {
    this.logger.log(
      `Creating user city assignment: userId=${userId}, cityId=${cityId}, role=${role}`,
    );

    try {
      const assignment = await this.prisma.userCityAssignment.create({
        data: {
          userId,
          cityId,
          role: role as UserRole,
          canManageAdmins: role === UserRole.CITY_ADMIN,
        },
        select: {
          id: true,
          userId: true,
          cityId: true,
          role: true,
          canManageAdmins: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        assignment,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('User already assigned to this city');
      }
      throw error;
    }
  }

  async assignCityAdmin(
    userId: string,
    cityId: string,
    role: string | number,
    assignedBy: string,
    canManageAdmins?: boolean,
  ) {
    this.logger.log(
      `Assigning city admin: userId=${userId}, cityId=${cityId}, role=${role}, assignedBy=${assignedBy}, canManageAdmins=${canManageAdmins}`,
    );

    // Normalize role - handle both string and number formats
    let normalizedRole: UserRole;
    if (typeof role === 'number') {
      // Convert number to enum (1=SUPER_ADMIN, 2=CITY_ADMIN, 3=CITIZEN)
      const roleMap: Record<number, UserRole> = {
        1: UserRole.SUPER_ADMIN,
        2: UserRole.CITY_ADMIN,
        3: UserRole.CITIZEN,
      };
      normalizedRole = roleMap[role] || UserRole.CITIZEN;
    } else {
      normalizedRole = role.toUpperCase() as UserRole;
    }

    // Create or update the city assignment
    const assignment = await this.prisma.userCityAssignment.upsert({
      where: {
        userId_cityId: {
          userId,
          cityId,
        },
      },
      update: {
        role: normalizedRole,
        canManageAdmins: canManageAdmins ?? true,
        isActive: true,
        assignedBy,
      },
      create: {
        userId,
        cityId,
        role: normalizedRole,
        canManageAdmins: canManageAdmins ?? true,
        assignedBy,
      },
      select: {
        id: true,
        userId: true,
        cityId: true,
        role: true,
        canManageAdmins: true,
        assignedBy: true,
        createdAt: true,
      },
    });

    // Always update user's role in the users table to match the assignment
    // This ensures the role is updated even when changing back to CITIZEN
    try {
      this.logger.log(
        `Updating user role in users table: userId=${userId}, role=${normalizedRole}`,
      );

      // Emit event to users service to update the role
      await firstValueFrom(
        this.client.send(RabbitMQPatterns.USER_UPDATE_ROLE, {
          userId,
          role: normalizedRole,
          updatedBy: assignedBy,
        }),
      );

      this.logger.log(`User role updated successfully in users table: userId=${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update user role in users table: userId=${userId}`, error);
      // Don't fail the assignment if role update fails
      // The assignment is still created, just log the error
    }

    return {
      success: true,
      assignment: {
        ...assignment,
        role: roleToNumber(assignment.role), // Convert enum string to number
      },
    };
  }

  /**
   * Ensures a Category exists for the given slug.
   * - For Event subcategories whose slug starts with an existing EVENT category slug + "-",
   *   it will auto-create a child under that parent with type CategoryType.EVENT.
   *   Examples: "events-konzert" → parent "events"
   *             "kodier-woche-events-konzert" → parent "kodier-woche-events"
   * - For all other slugs, it returns null (no auto-creation).
   * - If cityId is provided and a new category is created, it will also create a CityCategory
   *   mapping for that city.
   */
  private async ensureCategoryForSlug(
    categorySlug: string,
    cityId?: string,
    originalName?: string,
  ) {
    if (!categorySlug.includes('-')) {
      return null;
    }

    const existing = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (existing) {
      return existing;
    }

    // Find the parent EVENT category whose slug is the longest prefix of this slug.
    // e.g. "kodier-woche-events-konzert" matches parent "kodier-woche-events" (not "events").
    const eventCategories = await this.prisma.category.findMany({
      where: { type: CategoryType.EVENT, isActive: true },
      select: { id: true, slug: true, name: true },
    });

    const parentCategory = eventCategories
      .filter((c) => categorySlug.startsWith(c.slug + '-'))
      .sort((a, b) => b.slug.length - a.slug.length)[0];

    if (!parentCategory) {
      return null;
    }

    // Derive child name from the slug part after the parent slug prefix
    const rawNamePart = categorySlug.slice(parentCategory.slug.length + 1);
    const name =
      originalName && originalName.trim().length > 0
        ? originalName
        : rawNamePart.length > 0
          ? rawNamePart
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          : parentCategory.name;

    try {
      const created = await this.prisma.category.create({
        data: {
          name,
          slug: categorySlug,
          type: CategoryType.EVENT,
          isActive: true,
          parent: {
            connect: { id: parentCategory.id },
          },
        },
      });

      this.logger.log(
        `Auto-created Event subcategory "${categorySlug}" with id=${created.id} under parent '${parentCategory.slug}'`,
      );

      // If cityId is provided, create a CityCategory mapping for this newly created category
      if (cityId) {
        await this.ensureCityCategoryMapping(
          cityId,
          created.id,
          name,
          'de', // Destination One category names are in German
        );
      }

      return created;
    } catch (error: any) {
      // Handle potential race condition on unique slug
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' // Unique constraint violation
      ) {
        this.logger.debug(
          `Race condition detected: category with slug "${categorySlug}" was created by another request, fetching existing`,
        );
        const existing = await this.prisma.category.findUnique({
          where: { slug: categorySlug },
        });
        if (existing) {
          return existing;
        }
        // If we still can't find it, log and return null
        this.logger.warn(
          `Category with slug "${categorySlug}" should exist after P2002 error but was not found`,
        );
        return null;
      }

      this.logger.error(`Failed to auto-create category with slug "${categorySlug}"`, error);
      return null;
    }
  }

  /**
   * Ensures a CityCategory mapping exists for the given city and category.
   * Creates the mapping if it does not exist, and is safe to call repeatedly.
   */
  private async ensureCityCategoryMapping(
    cityId: string,
    categoryId: string,
    displayName: string,
    languageCode: string,
    displayOrder = 99,
  ): Promise<void> {
    try {
      // Check if CityCategory already exists (race condition handling)
      const existingCityCategory = await this.prisma.cityCategory.findUnique({
        where: {
          cityId_categoryId: {
            cityId,
            categoryId,
          },
        },
      });

      if (!existingCityCategory) {
        await this.prisma.cityCategory.create({
          data: {
            cityId,
            categoryId,
            displayName,
            languageCode,
            displayOrder,
            isActive: true,
          },
        });

        this.logger.log(
          `Auto-created CityCategory mapping for cityId=${cityId} and categoryId=${categoryId}`,
        );
      } else if (existingCityCategory.displayName !== displayName) {
        await this.prisma.cityCategory.update({
          where: {
            cityId_categoryId: {
              cityId,
              categoryId,
            },
          },
          data: {
            displayName,
            languageCode,
          },
        });

        this.logger.log(
          `Updated CityCategory displayName for cityId=${cityId} and categoryId=${categoryId} from "${existingCityCategory.displayName}" to "${displayName}"`,
        );
      }
    } catch (error: any) {
      // Handle potential race condition on unique constraint
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' // Unique constraint violation
      ) {
        this.logger.debug(
          `CityCategory already exists for cityId=${cityId} and categoryId=${categoryId}`,
        );
      } else {
        this.logger.warn(
          `Failed to ensure CityCategory for cityId=${cityId} and categoryId=${categoryId}: ${error?.message}`,
        );
        // Don't fail the caller if city category mapping fails
      }
    }
  }

  async getParkingSpaces(cityId: string, orderBy?: string): Promise<any[]> {
    // Check Redis cache first (store base data, apply translations per request)
    const cacheKey = `parking:spaces:${cityId}`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for parking spaces: ${cityId}`);
      return this.applyParkingSpaceTranslations(cached);
    }

    // Build orderBy clause
    const allowedOrderByFields = [
      'parkingSiteId',
      'name',
      'availableSpotNumber',
      'occupancy',
      'status',
    ];
    const orderByField =
      orderBy && allowedOrderByFields.includes(orderBy) ? orderBy : 'parkingSiteId';
    const orderByClause: any[] = [{ [orderByField]: 'asc' }];
    // Add parkingSiteId as tiebreaker when sorting by a different field
    if (orderByField !== 'parkingSiteId') {
      orderByClause.push({ parkingSiteId: 'asc' });
    }

    // Query database
    const spaces = await this.prisma.parkingSpace.findMany({
      where: {
        cityId,
      },
      orderBy: orderByClause,
    });

    // Transform to API response format
    const result = spaces.map((space) => ({
      id: space.id,
      parkingSiteId: space.parkingSiteId,
      name: space.name,
      description: space.description,
      location: {
        latitude: Number(space.latitude),
        longitude: Number(space.longitude),
        address: space.address,
      },
      capacity: {
        total: space.totalSpotNumber,
        available: space.availableSpotNumber,
        occupied: space.occupiedSpotNumber,
        occupancy: space.occupancy ? Number(space.occupancy) : null,
      },
      vehicleSlots: {
        fourWheeler: space.fourWheelerSlots,
        twoWheeler: space.twoWheelerSlots,
        unclassified: space.unclassifiedSlots,
      },
      status: space.status,
      lastUpdate: space.observationDateTime || space.lastSyncAt,
      pricing:
        space.priceRatePerMinute && space.priceCurrency
          ? {
              ratePerMinute: Number(space.priceRatePerMinute),
              currency: space.priceCurrency,
            }
          : null,
      metadata: space.metadata,
    }));

    // Cache base result for 60 seconds (matches API update interval)
    await this.redis.set(cacheKey, result, 60);

    return this.applyParkingSpaceTranslations(result);
  }

  /**
   * Apply translations to parking space fields based on current request language
   */
  private async applyParkingSpaceTranslations(spaces: any[]): Promise<any[]> {
    const locale = this.i18nService.getLanguage();

    // If no locale requested, return without translation
    if (!locale) {
      return spaces;
    }

    // Collect entities that need translation
    const entities: Array<{ entityType: string; entityId: string }> = [];
    for (const space of spaces) {
      const sourceLocale = space.languageCode || 'de';
      if (locale !== sourceLocale) {
        entities.push({ entityType: 'parkingSpace', entityId: space.id });
      }
    }

    // One query for all translations
    const translationMap = await this.translationService.prefetchTranslations(entities, locale);

    return spaces.map((space) => {
      const sourceLocale = space.languageCode || 'de';
      if (locale === sourceLocale) {
        return space;
      }

      return {
        ...space,
        name: this.translationService.getTranslationFromMap(
          translationMap,
          'parkingSpace',
          space.id,
          'name',
          locale,
          space.name ?? '',
          sourceLocale,
        ),
        description: this.translationService.getTranslationFromMap(
          translationMap,
          'parkingSpace',
          space.id,
          'description',
          locale,
          space.description ?? '',
          sourceLocale,
        ),
      };
    });
  }

  private async checkCityFeature(cityId: string, featureName: string): Promise<boolean> {
    try {
      const city = await firstValueFrom(
        this.client.send(RabbitMQPatterns.CITY_FIND_BY_ID, { id: cityId }),
      );

      if (!city) {
        return false;
      }

      const features = (city.metadata as any)?.features || {};
      return features[featureName] === true;
    } catch (error) {
      this.logger.error(`Error checking city feature: ${featureName}`, error);
      return false;
    }
  }

  /**
   * Process favorite event reminders and emit push notifications
   * Called by scheduler via RabbitMQ
   */
  async processFavoriteEventReminders(
    triggeredAt?: string,
    scheduleRunId?: string,
  ): Promise<{
    sent24h: number;
    sent2h: number;
  }> {
    const now = triggeredAt ? new Date(triggeredAt) : new Date();
    this.logger.log(`Processing favorite event reminders at ${now.toISOString()}`);

    // Acquire lock to prevent concurrent runs
    const lockKey = 'core:favorite-reminders:lock';
    const acquired = await this.redis.acquireLock(lockKey, 300); // 5 minute lock

    if (!acquired) {
      this.logger.warn(
        'Could not acquire lock for favorite event reminders - another run may be in progress',
      );
      return { sent24h: 0, sent2h: 0 };
    }

    try {
      const graceWindow = 60 * 60 * 1000; // 1 hour grace window

      // Compute time windows
      // 24h reminders: [now + 24h, now + 24h + graceWindow]
      const window24hStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const window24hEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000 + graceWindow);
      // 2h reminders: [now + 2h, now + 2h + graceWindow]
      const window2hStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const window2hEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000 + graceWindow);

      this.logger.debug(
        `Time windows - Now: ${now.toISOString()}, 24h: [${window24hStart.toISOString()}, ${window24hEnd.toISOString()}], 2h: [${window2hStart.toISOString()}, ${window2hEnd.toISOString()}]`,
      );

      // Fetch all active favorites with their listings
      const favorites = await this.prisma.userFavorite.findMany({
        include: {
          listing: {
            include: {
              timeIntervals: true,
              cities: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      });

      this.logger.debug(`Found ${favorites.length} total favorites to process`);

      let sent24h = 0;
      let sent2h = 0;
      let skippedCount = 0;
      const skipReasons: Record<string, number> = {};

      // Cache user notification preferences to avoid repeated RabbitMQ calls
      const userNotificationCache = new Map<string, boolean>();

      for (const favorite of favorites) {
        const listing = favorite.listing;

        this.logger.debug(
          `Processing favorite ${favorite.id} for listing ${listing.id} (eventStart: ${listing.eventStart?.toISOString() || 'null'})`,
        );

        // Skip if listing is not approved/visible or archived
        if (
          listing.status !== ListingStatus.APPROVED ||
          listing.moderationStatus !== ListingModerationStatus.APPROVED ||
          listing.visibility !== ListingVisibility.PUBLIC ||
          listing.isArchived
        ) {
          skippedCount++;
          const reason = `listing not approved/visible (status: ${listing.status}, moderation: ${listing.moderationStatus}, visibility: ${listing.visibility}, archived: ${listing.isArchived})`;
          skipReasons[reason] = (skipReasons[reason] || 0) + 1;
          this.logger.debug(`Skipping listing ${listing.id} - ${reason}`);
          continue;
        }

        // Check if user has notifications enabled
        let notificationsEnabled = userNotificationCache.get(favorite.userId);
        if (notificationsEnabled === undefined) {
          try {
            const userData = await firstValueFrom(
              this.client.send<
                { id: string; notificationsEnabled?: boolean } | null,
                { id: string }
              >(RabbitMQPatterns.USER_FIND_BY_ID, { id: favorite.userId }),
            );
            notificationsEnabled = userData?.notificationsEnabled !== false; // Default to true if not set
            userNotificationCache.set(favorite.userId, notificationsEnabled);
          } catch (error) {
            this.logger.warn(
              `Failed to fetch user notification preferences for user ${favorite.userId}, defaulting to enabled`,
            );
            notificationsEnabled = true;
            userNotificationCache.set(favorite.userId, notificationsEnabled);
          }
        }

        // Skip if user has disabled notifications
        if (!notificationsEnabled) {
          skippedCount++;
          skipReasons['notifications disabled'] = (skipReasons['notifications disabled'] || 0) + 1;
          this.logger.debug(
            `Skipping reminder for user ${favorite.userId} - notifications disabled`,
          );
          continue;
        }

        // Skip if listing has no event start time
        if (!listing.eventStart) {
          skippedCount++;
          skipReasons['no eventStart'] = (skipReasons['no eventStart'] || 0) + 1;
          this.logger.debug(`Skipping listing ${listing.id} - no eventStart`);
          continue;
        }

        // Compute upcoming occurrences - use eventStart only for both recurring and non-recurring
        // Search window spans from earliest (2h start) to latest (24h end) to capture all reminder types
        const allOccurrences = this.computeUpcomingOccurrences(
          {
            eventStart: listing.eventStart,
            eventEnd: listing.eventEnd,
            timeIntervals: [], // Ignore timeIntervals, use eventStart only
            timezone: listing.timezone,
          },
          window2hStart, // Earliest boundary (now + 2h)
          window24hEnd, // Latest boundary (now + 25h)
        );

        this.logger.debug(
          `Listing ${listing.id} - eventStart: ${listing.eventStart.toISOString()}, found ${allOccurrences.length} occurrences in search window`,
        );
        if (allOccurrences.length > 0) {
          this.logger.debug(
            `Occurrences: ${allOccurrences.map((o) => o.toISOString()).join(', ')}`,
          );
        }

        // Process 24h reminders
        const occurrences24h = allOccurrences.filter(
          (occ) => occ >= window24hStart && occ <= window24hEnd,
        );

        this.logger.debug(
          `Listing ${listing.id} - ${occurrences24h.length} occurrences in 24h window [${window24hStart.toISOString()}, ${window24hEnd.toISOString()}]`,
        );

        for (const occurrence of occurrences24h) {
          // Check if reminder already sent
          const existing = await this.prisma.listingReminder.findUnique({
            where: {
              userId_listingId_occurrenceStart_reminderType: {
                userId: favorite.userId,
                listingId: listing.id,
                occurrenceStart: occurrence,
                reminderType: ListingReminderType.H24,
              },
            },
          });

          if (!existing) {
            this.logger.debug(
              `Creating 24h reminder for user ${favorite.userId}, listing ${listing.id}, occurrence ${occurrence.toISOString()}`,
            );
            // Create reminder record
            await this.prisma.listingReminder.create({
              data: {
                userId: favorite.userId,
                listingId: listing.id,
                occurrenceStart: occurrence,
                reminderType: ListingReminderType.H24,
              },
            });

            // Emit notification
            await this.emitEventReminderNotification(
              favorite.userId,
              listing,
              occurrence,
              ListingReminderType.H24,
              scheduleRunId,
            );

            sent24h++;
            this.logger.debug(
              `Sent 24h reminder to user ${favorite.userId} for listing ${listing.id} at ${occurrence.toISOString()}`,
            );
          } else {
            this.logger.debug(
              `Skipping 24h reminder for user ${favorite.userId}, listing ${listing.id}, occurrence ${occurrence.toISOString()} - already sent (reminder ID: ${existing.id})`,
            );
          }
        }

        // Process 2h reminders
        const occurrences2h = allOccurrences.filter(
          (occ) => occ >= window2hStart && occ <= window2hEnd,
        );

        this.logger.debug(
          `Listing ${listing.id} - ${occurrences2h.length} occurrences in 2h window [${window2hStart.toISOString()}, ${window2hEnd.toISOString()}]`,
        );

        for (const occurrence of occurrences2h) {
          // Check if reminder already sent
          const existing = await this.prisma.listingReminder.findUnique({
            where: {
              userId_listingId_occurrenceStart_reminderType: {
                userId: favorite.userId,
                listingId: listing.id,
                occurrenceStart: occurrence,
                reminderType: ListingReminderType.H2,
              },
            },
          });

          if (!existing) {
            this.logger.debug(
              `Creating 2h reminder for user ${favorite.userId}, listing ${listing.id}, occurrence ${occurrence.toISOString()}`,
            );
            // Create reminder record
            await this.prisma.listingReminder.create({
              data: {
                userId: favorite.userId,
                listingId: listing.id,
                occurrenceStart: occurrence,
                reminderType: ListingReminderType.H2,
              },
            });

            // Emit notification
            await this.emitEventReminderNotification(
              favorite.userId,
              listing,
              occurrence,
              ListingReminderType.H2,
              scheduleRunId,
            );

            sent2h++;
            this.logger.debug(
              `Sent 2h reminder to user ${favorite.userId} for listing ${listing.id} at ${occurrence.toISOString()}`,
            );
          } else {
            this.logger.debug(
              `Skipping 2h reminder for user ${favorite.userId}, listing ${listing.id}, occurrence ${occurrence.toISOString()} - already sent (reminder ID: ${existing.id})`,
            );
          }
        }
      }

      this.logger.log(
        `Processed favorite event reminders: ${sent24h} 24h reminders, ${sent2h} 2h reminders, ${skippedCount} skipped`,
      );
      if (Object.keys(skipReasons).length > 0) {
        this.logger.debug(`Skip reasons: ${JSON.stringify(skipReasons, null, 2)}`);
      }

      return { sent24h, sent2h };
    } finally {
      await this.redis.releaseLock(lockKey);
    }
  }

  /**
   * Compute upcoming event occurrences for a listing within a time window
   */
  private computeUpcomingOccurrences(
    listing: {
      eventStart: Date | null;
      eventEnd: Date | null;
      timeIntervals: Array<{
        weekdays: string[];
        start: Date;
        end: Date;
        tz: string;
        freq: ListingRecurrenceFreq;
        interval: number;
        repeatUntil: Date | null;
      }>;
      timezone: string | null;
    },
    windowStart: Date,
    windowEnd: Date,
  ): Date[] {
    const occurrences: Date[] = [];

    // Use eventStart directly from database for both recurring and non-recurring events
    if (listing.eventStart) {
      if (listing.eventStart >= windowStart && listing.eventStart <= windowEnd) {
        occurrences.push(listing.eventStart);
      }
      return occurrences;
    }

    // Fallback: if no eventStart, check timeIntervals (should not happen with new logic)
    if (listing.timeIntervals && listing.timeIntervals.length > 0) {
      // Map weekday names to day numbers (0 = Sunday, 1 = Monday, etc.)
      const weekdayToNumber: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      for (const interval of listing.timeIntervals) {
        if (interval.freq === ListingRecurrenceFreq.NONE) {
          // Single occurrence
          if (interval.start >= windowStart && interval.start <= windowEnd) {
            occurrences.push(interval.start);
          }
          continue;
        }

        const repeatUntil = interval.repeatUntil
          ? new Date(interval.repeatUntil)
          : new Date(windowEnd.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days beyond window

        // Special handling for WEEKLY frequency with multiple weekdays
        if (
          interval.freq === ListingRecurrenceFreq.WEEKLY &&
          interval.weekdays &&
          interval.weekdays.length > 0
        ) {
          // Get the time portion from interval.start (hours, minutes, seconds)
          const startTime = {
            hours: interval.start.getHours(),
            minutes: interval.start.getMinutes(),
            seconds: interval.start.getSeconds(),
            milliseconds: interval.start.getMilliseconds(),
          };

          // Find the Monday of the week containing interval.start
          const startDate = new Date(interval.start);
          const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() + mondayOffset);
          weekStart.setHours(0, 0, 0, 0);

          let currentWeekStart = new Date(weekStart);
          let iterations = 0;
          const maxIterations = 1000;

          while (iterations < maxIterations) {
            // For each specified weekday, generate an occurrence in this week
            for (const weekdayName of interval.weekdays) {
              const weekdayNum = weekdayToNumber[weekdayName];
              if (weekdayNum === undefined) continue;

              // Calculate the date for this weekday in the current week
              // Monday = 1, so we need to offset from Monday (which is our week start)
              const daysFromMonday = weekdayNum === 0 ? 6 : weekdayNum - 1; // Sunday is 6 days from Monday
              const occurrenceDate = new Date(currentWeekStart);
              occurrenceDate.setDate(currentWeekStart.getDate() + daysFromMonday);
              occurrenceDate.setHours(
                startTime.hours,
                startTime.minutes,
                startTime.seconds,
                startTime.milliseconds,
              );

              // Check if this occurrence is valid
              if (
                occurrenceDate >= interval.start &&
                occurrenceDate <= repeatUntil &&
                occurrenceDate >= windowStart &&
                occurrenceDate <= windowEnd
              ) {
                occurrences.push(new Date(occurrenceDate));
              }
            }

            // Advance to the next week (respecting interval)
            currentWeekStart = new Date(
              currentWeekStart.getTime() + interval.interval * 7 * 24 * 60 * 60 * 1000,
            );

            // Stop if we've passed the repeatUntil or windowEnd
            if (currentWeekStart > repeatUntil || currentWeekStart > windowEnd) {
              break;
            }

            iterations++;
          }
        } else {
          // Original logic for non-weekly or no weekday filter
          let current = new Date(interval.start);

          // Limit iterations to prevent infinite loops
          let iterations = 0;
          const maxIterations = 1000;

          while (current <= repeatUntil && current <= windowEnd && iterations < maxIterations) {
            if (current >= windowStart) {
              // Check if this occurrence matches the weekday filter (if any)
              if (interval.weekdays && interval.weekdays.length > 0) {
                const weekday = current
                  .toLocaleDateString('en-US', { weekday: 'short' })
                  .toUpperCase();
                if (interval.weekdays.includes(weekday)) {
                  occurrences.push(new Date(current));
                }
              } else {
                occurrences.push(new Date(current));
              }
            }

            // Advance to next occurrence based on frequency
            switch (interval.freq) {
              case ListingRecurrenceFreq.DAILY:
                current = new Date(current.getTime() + interval.interval * 24 * 60 * 60 * 1000);
                break;
              case ListingRecurrenceFreq.WEEKLY:
                current = new Date(current.getTime() + interval.interval * 7 * 24 * 60 * 60 * 1000);
                break;
              case ListingRecurrenceFreq.MONTHLY:
                current = new Date(current);
                current.setMonth(current.getMonth() + interval.interval);
                break;
              case ListingRecurrenceFreq.YEARLY:
                current = new Date(current);
                current.setFullYear(current.getFullYear() + interval.interval);
                break;
              default:
                break;
            }

            iterations++;
          }
        }
      }
    }

    // Sort and deduplicate occurrences
    return Array.from(new Set(occurrences.map((d) => d.getTime())))
      .map((t) => new Date(t))
      .sort((a, b) => a.getTime() - b.getTime());
  }

  /**
   * Emit a push notification for an event reminder
   */
  private async emitEventReminderNotification(
    userId: string,
    listing: {
      id: string;
      title: string;
      primaryCityId: string | null;
      cities: Array<{ cityId: string }>;
    },
    occurrenceStart: Date,
    reminderType: ListingReminderType,
    scheduleRunId?: string,
  ): Promise<void> {
    try {
      // Get city name if available
      let cityName: string | undefined;
      const cityId = listing.primaryCityId || listing.cities[0]?.cityId;
      if (cityId) {
        try {
          const city = await firstValueFrom(
            this.client.send(RabbitMQPatterns.CITY_FIND_BY_ID, { id: cityId }),
          );
          cityName = city?.name;
        } catch (error) {
          this.logger.warn(`Failed to fetch city name for cityId: ${cityId}`, error);
        }
      }

      // Determine translation key based on reminder type
      const translationKey =
        reminderType === ListingReminderType.H24
          ? 'notifications.event.reminder24h'
          : 'notifications.event.reminder2h';

      // Build notification DTO
      const notificationDto: SendNotificationDto = {
        userId,
        type: 'EVENT_REMINDER',
        channel: 'PUSH',
        translationKey,
        translationParams: {
          eventTitle: listing.title,
          cityName: cityName || '',
        },
        cityId: cityId || undefined,
        fcmData: {
          kind: 'event',
          listingId: listing.id,
          occurrenceStartIso: occurrenceStart.toISOString(),
        },
        content: '', // Will be filled by translation service
        subject: '', // Will be filled by translation service
        metadata: scheduleRunId ? { scheduleRunId } : undefined,
      };

      // Emit notification
      this.client.emit(RabbitMQPatterns.NOTIFICATION_SEND, notificationDto);

      this.logger.log(
        `Emitted ${reminderType} reminder notification for user ${userId}, listing ${listing.id}, occurrence ${occurrenceStart.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit reminder notification for user ${userId}, listing ${listing.id}`,
        error,
      );
      // Don't throw - continue processing other reminders
    }
  }

  /**
   * Hard-delete event listings whose last possible occurrence is in the past.
   * Called by the scheduler via RabbitMQ daily at 2 AM UTC.
   *
   * Expiry rules (see spec: docs/superpowers/specs/2026-04-16-expire-events-cleanup-design.md):
   * - No intervals + eventEnd < now → expired
   * - All non-recurring intervals (freq=NONE) have end < now → expired
   * - All recurring intervals have repeatUntil < now → expired
   * - Any open-ended recurring interval (repeatUntil=null) → skip listing
   * - No intervals + no eventEnd → skip listing
   */
  async cleanupExpiredEventListings(): Promise<{ deleted: number; skipped: number }> {
    const now = new Date();
    this.logger.log('Starting expired event listings cleanup');

    // Step 1: Fetch candidates — non-DELETED event listings with timing info
    const candidates = await this.prisma.listing.findMany({
      where: {
        status: { not: ListingStatus.DELETED },
        categories: { some: { category: { type: CategoryType.EVENT } } },
        OR: [
          // No intervals — evaluate via eventEnd (skip if null, handled by { not: null })
          { eventEnd: { not: null }, timeIntervals: { none: {} } },
          // Has intervals — expiry evaluated in application logic below
          { timeIntervals: { some: {} } },
        ],
      },
      select: {
        id: true,
        eventEnd: true,
        timeIntervals: {
          select: {
            id: true,
            freq: true,
            end: true,
            repeatUntil: true,
          },
        },
      },
    });

    this.logger.log(`Found ${candidates.length} candidate listing(s) to evaluate`);

    // Step 2: Filter using expiry logic
    const expiredIds: string[] = [];
    let skipped = 0;

    for (const listing of candidates) {
      try {
        if (this.isListingExpired(listing, now)) {
          expiredIds.push(listing.id);
        } else {
          skipped++;
        }
      } catch (error) {
        this.logger.warn(
          `Error evaluating listing ${listing.id} for expiry — skipping`,
          error instanceof Error ? error.message : String(error),
        );
        skipped++;
      }
    }

    this.logger.log(`Expiry evaluation complete: ${expiredIds.length} expired, ${skipped} skipped`);

    // Step 3: Hard delete in chunks of 100 (cascade handles related records)
    const chunkSize = 100;
    let deleted = 0;

    for (let i = 0; i < expiredIds.length; i += chunkSize) {
      const chunk = expiredIds.slice(i, i + chunkSize);
      const deleteResult = await this.prisma.listing.deleteMany({ where: { id: { in: chunk } } });
      deleted += deleteResult.count;
      this.logger.debug(
        `Deleted chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.length} listing(s)`,
      );
    }

    this.logger.log(`Cleanup complete: deleted ${deleted}, skipped ${skipped}`);
    return { deleted, skipped };
  }

  private isListingExpired(
    listing: {
      id: string;
      eventEnd: Date | null;
      timeIntervals: Array<{
        id: string;
        freq: ListingRecurrenceFreq;
        end: Date;
        repeatUntil: Date | null;
      }>;
    },
    now: Date,
  ): boolean {
    // No time intervals — use eventEnd
    if (listing.timeIntervals.length === 0) {
      // eventEnd is non-null here when called from cleanupExpiredEventListings (OR branch 1 enforces it),
      // but we guard anyway to make this method safe if called in other contexts.
      return listing.eventEnd !== null && listing.eventEnd < now;
    }

    // Has intervals — all must be expired; any active or open-ended → not expired
    for (const interval of listing.timeIntervals) {
      if (interval.freq === ListingRecurrenceFreq.NONE) {
        // Non-recurring: use interval end date
        if (interval.end >= now) return false; // Still active
      } else {
        // Recurring: must have repeatUntil to determine expiry
        if (!interval.repeatUntil) return false; // Open-ended — skip
        if (interval.repeatUntil >= now) return false; // Still recurring
      }
    }

    return true; // All intervals are provably in the past
  }
}
