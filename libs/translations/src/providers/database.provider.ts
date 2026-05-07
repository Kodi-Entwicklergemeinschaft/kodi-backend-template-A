import { Injectable } from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma';
import { TranslationSource } from '../interfaces/translation.types';
import type { Translation } from '@prisma/client-core';

@Injectable()
export class DatabaseProvider {
  constructor(private readonly prisma: PrismaCoreService) {}

  /**
   * Batch-fetch translations for multiple entities, filtered to a single locale.
   * Groups by entityType for efficient OR + IN queries.
   * Uses @@index([entityType, entityId]) index.
   */
  async findByEntitiesAndLocale(
    entities: Array<{ entityType: string; entityId: string }>,
    locale: string,
  ): Promise<Translation[]> {
    if (entities.length === 0) return [];

    // Group by entityType for efficient query
    const byType = new Map<string, string[]>();
    for (const { entityType, entityId } of entities) {
      const ids = byType.get(entityType);
      if (ids) {
        ids.push(entityId);
      } else {
        byType.set(entityType, [entityId]);
      }
    }

    const orClauses = Array.from(byType.entries()).map(([entityType, entityIds]) => ({
      entityType,
      entityId: { in: entityIds },
    }));

    return this.prisma.translation.findMany({
      where: {
        OR: orClauses,
        locale,
      },
    });
  }

  /**
   * Find translation by entity and locale
   */
  async findByEntityAndLocale(
    entityType: string,
    entityId: string,
    field: string,
    locale: string,
  ): Promise<Translation | null> {
    return this.prisma.translation.findUnique({
      where: {
        entityType_entityId_field_locale: {
          entityType,
          entityId,
          field,
          locale,
        },
      },
    });
  }

  /**
   * Find translation by key and locale
   */
  async findByKeyAndLocale(key: string, locale: string): Promise<Translation | null> {
    return this.prisma.translation.findUnique({
      where: {
        key_locale: {
          key,
          locale,
        },
      },
    });
  }

  /**
   * Upsert translation (create or update)
   */
  async upsertTranslation(data: {
    key?: string;
    entityType?: string;
    entityId?: string;
    field?: string;
    locale: string;
    value: string;
    sourceLocale?: string;
    sourceHash?: string;
    source?: TranslationSource;
    metadata?: Record<string, unknown>;
  }): Promise<Translation> {
    const {
      key,
      entityType,
      entityId,
      field,
      locale,
      value,
      sourceLocale,
      sourceHash,
      source,
      metadata,
    } = data;

    if (key) {
      // Key-based translation
      return this.prisma.translation.upsert({
        where: {
          key_locale: {
            key,
            locale,
          },
        },
        create: {
          key,
          locale,
          value,
          sourceLocale,
          sourceHash,
          source,
          metadata: metadata ? (metadata as any) : undefined,
        },
        update: {
          value,
          sourceLocale,
          sourceHash,
          source,
          metadata: metadata ? (metadata as any) : undefined,
          updatedAt: new Date(),
        },
      });
    } else if (entityType && entityId && field) {
      // Entity-based translation
      return this.prisma.translation.upsert({
        where: {
          entityType_entityId_field_locale: {
            entityType,
            entityId,
            field,
            locale,
          },
        },
        create: {
          entityType,
          entityId,
          field,
          locale,
          value,
          sourceLocale,
          sourceHash,
          source,
          metadata: metadata ? (metadata as any) : undefined,
        },
        update: {
          value,
          sourceLocale,
          sourceHash,
          source,
          metadata: metadata ? (metadata as any) : undefined,
          updatedAt: new Date(),
        },
      });
    } else {
      throw new Error('Either key or (entityType, entityId, field) must be provided');
    }
  }

  /**
   * Check if translation exists with matching sourceHash
   */
  async hasTranslationWithHash(
    entityType: string,
    entityId: string,
    field: string,
    locale: string,
    sourceHash: string,
  ): Promise<boolean> {
    const translation = await this.findByEntityAndLocale(entityType, entityId, field, locale);
    return translation?.sourceHash === sourceHash;
  }

  /**
   * Find all translations for an entity
   */
  async findByEntity(entityType: string, entityId: string): Promise<Translation[]> {
    return this.prisma.translation.findMany({
      where: {
        entityType,
        entityId,
      },
    });
  }

  /**
   * Delete translation
   */
  async deleteTranslation(id: string): Promise<void> {
    await this.prisma.translation.delete({
      where: { id },
    });
  }
}
