import { Injectable, OnModuleInit, Inject, NotFoundException } from '@nestjs/common';
import { PrismaNotificationService } from '@kodi/prisma';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';
import {
  SendNotificationDto,
  BulkNotificationDto,
  CreateFirebaseProjectDto,
  UpdateFirebaseProjectDto,
  CreateCityFirebaseProjectDto,
  FirebaseProjectResponseDto,
} from '@kodi/contracts';
import { FirebaseProjectManager } from '../fcm/firebase-project-manager.service';
import { FCMPushService } from '../fcm/fcm-push.service';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaNotificationService,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly firebaseProjectManager: FirebaseProjectManager,
    private readonly fcmPushService: FCMPushService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(NotificationService.name);
  }

  async onModuleInit() {
    // Listen to notification events
    this.logger.log('Notification service initialized - listening to events');
  }

  async send(dto: SendNotificationDto) {
    this.logger.log(`Sending notification to user: ${dto.userId}`);

    // Merge cityId, fcmData, and translation fields into metadata for the message handler
    const metadata = {
      ...(dto.metadata || {}),
      ...(dto.cityId && { cityId: dto.cityId }),
      ...(dto.fcmData && { fcmData: dto.fcmData }),
      ...(dto.translationKey && { translationKey: dto.translationKey }),
      ...(dto.translationParams && { translationParams: dto.translationParams }),
    };

    // Extract scheduleRunId from metadata if present
    const scheduleRunId = dto.metadata?.scheduleRunId || null;
    // Remove scheduleRunId from metadata to avoid duplication
    if (metadata.scheduleRunId) {
      delete metadata.scheduleRunId;
    }

    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channel: dto.channel,
        subject: dto.subject,
        content: dto.content,
        metadata: metadata,
        scheduleRunId: scheduleRunId,
        status: 'PENDING',
      },
    });

    // Queue notification for delivery
    this.client.emit(RabbitMQPatterns.NOTIFICATION_SEND, {
      notificationId: notification.id,
      userId: dto.userId,
      type: dto.type,
      channel: dto.channel,
      subject: dto.subject,
      content: dto.content,
      cityId: dto.cityId,
      fcmData: dto.fcmData,
      translationKey: dto.translationKey,
      translationParams: dto.translationParams,
      metadata, // Include merged metadata
    });

    this.logger.log(`Notification queued: ${notification.id}`);
    return notification;
  }

  async getUserNotifications(userId: string, status?: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Send bulk notifications to all users in a city
   */
  async sendBulkToCity(cityId: string, dto: BulkNotificationDto) {
    this.logger.log(`Sending bulk notifications to city: ${cityId}`);

    let page = 1;
    const limit = 100;
    let totalSent = 0;
    let totalFailed = 0;

    while (true) {
      try {
        // Fetch users by city
        const result = await firstValueFrom(
          this.client
            .send<
              any,
              { cityId: string; page?: number; limit?: number }
            >(RabbitMQPatterns.USER_FIND_BY_CITY, { cityId, page, limit })
            .pipe(timeout(30000)),
        );

        if (!result || !result.users || result.users.length === 0) {
          break; // No more users
        }

        // Send notifications to each user
        const promises = result.users.map(async (user: any) => {
          try {
            await this.send({
              ...dto,
              userId: user.id,
              cityId: cityId, // Use the city ID from the parameter
            });
            totalSent++;
          } catch (error) {
            this.logger.error(`Failed to send notification to user ${user.id}`, error);
            totalFailed++;
          }
        });

        await Promise.allSettled(promises);

        // Check if there are more pages
        if (result.pages && page >= result.pages) {
          break;
        }

        page++;
      } catch (error) {
        this.logger.error(`Error fetching users for city ${cityId}`, error);
        throw error;
      }
    }

    return {
      success: true,
      cityId,
      totalSent,
      totalFailed,
      message: `Bulk notifications sent to city ${cityId}`,
    };
  }

  /**
   * Send bulk notifications to all active users (uses their respective city projects)
   */
  async sendBulkToAll(dto: BulkNotificationDto) {
    this.logger.log(`Sending bulk notifications to all active users`);

    let page = 1;
    const limit = 100;
    let totalSent = 0;
    let totalFailed = 0;
    const cityGroups = new Map<string, any[]>();

    // First, collect all users grouped by city
    while (true) {
      try {
        const result = await firstValueFrom(
          this.client
            .send<any, { page?: number; limit?: number }>(RabbitMQPatterns.USER_FIND_ALL_ACTIVE, {
              page,
              limit,
            })
            .pipe(timeout(30000)),
        );

        if (!result || !result.users || result.users.length === 0) {
          break; // No more users
        }

        // Group users by city
        for (const user of result.users) {
          const cityId = user.cityId || 'default';
          if (!cityGroups.has(cityId)) {
            cityGroups.set(cityId, []);
          }
          cityGroups.get(cityId)!.push(user);
        }

        // Check if there are more pages
        if (result.pages && page >= result.pages) {
          break;
        }

        page++;
      } catch (error) {
        this.logger.error(`Error fetching active users`, error);
        throw error;
      }
    }

    // Send notifications grouped by city (each city uses its own Firebase project)
    for (const [cityId, users] of cityGroups.entries()) {
      const promises = users.map(async (user: any) => {
        try {
          await this.send({
            ...dto,
            userId: user.id,
            cityId: cityId === 'default' ? undefined : cityId,
          });
          totalSent++;
        } catch (error) {
          this.logger.error(`Failed to send notification to user ${user.id}`, error);
          totalFailed++;
        }
      });

      await Promise.allSettled(promises);
    }

    return {
      success: true,
      totalSent,
      totalFailed,
      citiesProcessed: cityGroups.size,
      message: 'Bulk notifications sent to all active users',
    };
  }

  /**
   * Get all Firebase projects
   */
  async getFirebaseProjects(): Promise<FirebaseProjectResponseDto[]> {
    const projects = await this.prisma.firebaseProject.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return projects.map((project) => ({
      id: project.id,
      cityId: project.cityId || undefined,
      projectId: project.projectId,
      projectName: project.projectName,
      isActive: project.isActive,
      isDefault: project.isDefault,
      metadata: project.metadata as any,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  }

  /**
   * Create a new Firebase project
   */
  async createFirebaseProject(dto: CreateFirebaseProjectDto): Promise<FirebaseProjectResponseDto> {
    // Encrypt credentials
    const encryptedCredentials = this.firebaseProjectManager.encrypt(dto.credentials);

    const project = await this.prisma.firebaseProject.create({
      data: {
        cityId: dto.cityId || null,
        projectId: dto.projectId,
        projectName: dto.projectName,
        credentials: encryptedCredentials as any,
        isDefault: dto.isDefault || false,
        metadata: dto.metadata || {},
        isActive: true,
      },
    });

    // Reload projects to cache the new one
    await this.firebaseProjectManager.onModuleInit();

    return {
      id: project.id,
      cityId: project.cityId || undefined,
      projectId: project.projectId,
      projectName: project.projectName,
      isActive: project.isActive,
      isDefault: project.isDefault,
      metadata: project.metadata as any,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Create or update Firebase project for a specific city
   */
  async upsertCityFirebaseProject(
    cityId: string,
    dto: CreateCityFirebaseProjectDto,
  ): Promise<FirebaseProjectResponseDto> {
    // Verify city exists
    const city = await firstValueFrom(
      this.client
        .send<any, { id: string }>(RabbitMQPatterns.CITY_FIND_BY_ID, { id: cityId })
        .pipe(timeout(10000)),
    ).catch(() => null);

    if (!city) {
      throw new NotFoundException(`City with ID ${cityId} not found`);
    }

    const encryptedCredentials = this.firebaseProjectManager.encrypt(dto.credentials);

    const updateData: any = {
      projectId: dto.projectId,
      projectName: dto.projectName,
      credentials: encryptedCredentials as any,
      isActive: true,
      isDefault: false,
    };

    if (dto.metadata !== undefined) {
      updateData.metadata = dto.metadata;
    }

    const project = await this.prisma.firebaseProject.upsert({
      where: { cityId },
      update: updateData,
      create: {
        cityId,
        projectId: dto.projectId,
        projectName: dto.projectName,
        credentials: encryptedCredentials as any,
        metadata: dto.metadata ?? {},
        isActive: true,
        isDefault: false,
      },
    });

    // Refresh Firebase app cache so future notifications use the new credentials
    this.firebaseProjectManager.clearCache(project.id);
    await this.firebaseProjectManager.onModuleInit();

    return {
      id: project.id,
      cityId: project.cityId || undefined,
      projectId: project.projectId,
      projectName: project.projectName,
      isActive: project.isActive,
      isDefault: project.isDefault,
      metadata: project.metadata as any,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Update a Firebase project
   */
  async updateFirebaseProject(
    id: string,
    dto: UpdateFirebaseProjectDto,
  ): Promise<FirebaseProjectResponseDto> {
    const existing = await this.prisma.firebaseProject.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Firebase project with ID ${id} not found`);
    }

    const updateData: any = {};

    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.projectName !== undefined) updateData.projectName = dto.projectName;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    // If credentials are being updated, encrypt them and clear cache
    if (dto.credentials !== undefined) {
      updateData.credentials = this.firebaseProjectManager.encrypt(dto.credentials) as any;
      // Clear cache for this project
      this.firebaseProjectManager.clearCache(id);
    }

    const project = await this.prisma.firebaseProject.update({
      where: { id },
      data: updateData,
    });

    // Reload the project into cache
    await this.firebaseProjectManager.onModuleInit();

    return {
      id: project.id,
      cityId: project.cityId || undefined,
      projectId: project.projectId,
      projectName: project.projectName,
      isActive: project.isActive,
      isDefault: project.isDefault,
      metadata: project.metadata as any,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Delete (deactivate) a Firebase project
   */
  async deleteFirebaseProject(id: string): Promise<void> {
    const existing = await this.prisma.firebaseProject.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Firebase project with ID ${id} not found`);
    }

    // Soft delete by setting isActive to false
    await this.prisma.firebaseProject.update({
      where: { id },
      data: { isActive: false },
    });

    // Clear cache
    this.firebaseProjectManager.clearCache(id);
  }
}
