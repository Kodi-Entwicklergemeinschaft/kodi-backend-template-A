import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CategoryViewType,
  SubServiceItemType as PrismaSubServiceItemType,
} from '@prisma/client-core';
import { PrismaCoreService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import {
  CategoryResponseDto,
  CreateSubServiceDto,
  CreateSubServiceItemType,
  ReorderSubServiceItemDto,
  SubServiceItemDto,
  SubServiceItemType,
  UpdateSubServiceDto,
} from '@kodi/contracts';

@Injectable()
export class SubServicesService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaCoreService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(SubServicesService.name);
  }

  /**
   * Batch-load sub-service items for multiple SUB_SERVICES categories.
   * Single query per item type — no N+1.
   */
  async loadSubServicesForCategories(
    categoryIds: string[],
    cityId: string,
  ): Promise<Map<string, SubServiceItemDto[]>> {
    if (!categoryIds.length) return new Map();

    const records = await this.prisma.categorySubService.findMany({
      where: { categoryId: { in: categoryIds }, isActive: true },
      orderBy: { id: 'asc' },
    });

    if (!records.length) return new Map();

    const tileIds = records
      .filter((r) => r.itemType === PrismaSubServiceItemType.TILE)
      .map((r) => r.itemId);
    const catIds = records
      .filter(
        (r) =>
          r.itemType === PrismaSubServiceItemType.CATEGORY ||
          r.itemType === PrismaSubServiceItemType.MAP,
      )
      .map((r) => r.itemId);

    const now = new Date();
    const [tiles, cats] = await Promise.all([
      tileIds.length
        ? this.prisma.tile.findMany({
            where: {
              id: { in: tileIds },
              isActive: true,
              OR: [{ publishAt: null }, { publishAt: { lte: now } }],
              AND: [{ OR: [{ expireAt: null }, { expireAt: { gt: now } }] }],
              cities: { some: { cityId } },
            },
            include: { cities: true },
          })
        : Promise.resolve([]),
      catIds.length
        ? this.prisma.category.findMany({
            where: { id: { in: catIds }, isActive: true },
            include: { children: { where: { isActive: true }, orderBy: { name: 'asc' } } },
          })
        : Promise.resolve([]),
    ]);

    const tileMap = new Map(tiles.map((t) => [t.id, t] as [string, (typeof tiles)[0]]));
    const catMap = new Map(cats.map((c) => [c.id, c] as [string, (typeof cats)[0]]));
    const result = new Map<string, SubServiceItemDto[]>();

    for (const record of records) {
      const list = result.get(record.categoryId) ?? [];

      if (record.itemType === PrismaSubServiceItemType.TILE) {
        const tile = tileMap.get(record.itemId);
        if (!tile) continue;
        list.push(
          this.mapTileToSubService(
            record.id,
            record.displayOrder ?? null,
            tile,
            record.displayName ?? null,
          ),
        );
      } else {
        const cat = catMap.get(record.itemId);
        if (!cat) continue;
        const itemType =
          record.itemType === PrismaSubServiceItemType.MAP
            ? SubServiceItemType.MAP
            : SubServiceItemType.CATEGORY;
        list.push(
          this.mapCategoryToSubService(
            record.id,
            record.displayOrder ?? null,
            cat,
            itemType,
            record.displayName ?? null,
          ),
        );
      }

      result.set(record.categoryId, list);
    }

    for (const [, list] of result) {
      list.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return result;
  }

  async createSubService(categoryId: string, dto: CreateSubServiceDto): Promise<SubServiceItemDto> {
    const parent = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!parent) throw new NotFoundException(`Category ${categoryId} not found`);

    if (parent.viewType !== CategoryViewType.SUB_SERVICES) {
      throw new BadRequestException(
        `Category ${categoryId} must have viewType SUB_SERVICES to add sub-services`,
      );
    }

    if (dto.itemType === CreateSubServiceItemType.TILE) {
      const tile = await this.prisma.tile.findUnique({
        where: { id: dto.itemId },
        select: { id: true },
      });
      if (!tile) throw new NotFoundException(`Tile ${dto.itemId} not found`);
    } else {
      if (dto.itemId === categoryId) {
        throw new BadRequestException(
          'A category or MAP item cannot reference its own parent category',
        );
      }
      const cat = await this.prisma.category.findUnique({
        where: { id: dto.itemId },
        select: { id: true },
      });
      if (!cat) throw new NotFoundException(`Category ${dto.itemId} not found`);
    }

    const prismaItemType = dto.itemType as unknown as PrismaSubServiceItemType;
    const existingMapping = await this.prisma.categorySubService.findFirst({
      where: { categoryId, itemType: prismaItemType, itemId: dto.itemId },
    });
    if (existingMapping) {
      return this.loadSingleSubService(existingMapping.id);
    }

    const record = await this.prisma.categorySubService.create({
      data: {
        categoryId,
        itemType: prismaItemType,
        itemId: dto.itemId,
        displayOrder: dto.displayOrder ?? null,
        displayName: dto.displayName || null,
      },
    });

    return this.loadSingleSubService(record.id);
  }

  async updateSubService(
    categoryId: string,
    subServiceId: string,
    dto: UpdateSubServiceDto,
  ): Promise<SubServiceItemDto> {
    const existing = await this.prisma.categorySubService.findFirst({
      where: { id: subServiceId, categoryId },
    });
    if (!existing) {
      throw new NotFoundException(
        `Sub-service ${subServiceId} not found in category ${categoryId}`,
      );
    }

    await this.prisma.categorySubService.update({
      where: { id: subServiceId },
      data: {
        ...(dto.displayOrder !== undefined && {
          displayOrder: dto.displayOrder,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName || null }),
      },
    });

    return this.loadSingleSubService(subServiceId);
  }

  async deleteTileSubService(categoryId: string, tileId: string): Promise<{ message: string }> {
    const existing = await this.prisma.categorySubService.findFirst({
      where: {
        categoryId,
        itemType: PrismaSubServiceItemType.TILE,
        itemId: tileId,
      },
    });
    if (existing) {
      await this.prisma.categorySubService.delete({ where: { id: existing.id } });
    }
    return { message: 'Sub-service removed successfully' };
  }

  async reorderSubServices(
    categoryId: string,
    items: ReorderSubServiceItemDto[],
  ): Promise<SubServiceItemDto[]> {
    const existing = await this.prisma.categorySubService.findMany({
      where: { categoryId, isActive: true },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((r) => r.id));

    for (const item of items) {
      if (!existingIds.has(item.id)) {
        throw new NotFoundException(`Sub-service ${item.id} not found in category ${categoryId}`);
      }
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.categorySubService.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    const updated = await this.prisma.categorySubService.findMany({
      where: { categoryId, isActive: true },
      orderBy: { id: 'asc' },
    });

    const reorderedDtos = await Promise.all(updated.map((r) => this.loadSingleSubService(r.id)));
    reorderedDtos.sort((a, b) => a.displayOrder - b.displayOrder);
    return reorderedDtos;
  }

  private async loadSingleSubService(subServiceId: string): Promise<SubServiceItemDto> {
    const record = await this.prisma.categorySubService.findUnique({ where: { id: subServiceId } });
    if (!record) throw new NotFoundException(`Sub-service ${subServiceId} not found`);

    if (record.itemType === PrismaSubServiceItemType.TILE) {
      const tile = await this.prisma.tile.findUnique({
        where: { id: record.itemId },
        include: { cities: true },
      });
      if (!tile) throw new NotFoundException(`Referenced tile ${record.itemId} not found`);
      return this.mapTileToSubService(
        record.id,
        record.displayOrder ?? null,
        tile,
        record.displayName ?? null,
      );
    } else {
      const cat = await this.prisma.category.findUnique({
        where: { id: record.itemId },
        include: { children: { where: { isActive: true }, orderBy: { name: 'asc' } } },
      });
      if (!cat) throw new NotFoundException(`Referenced category ${record.itemId} not found`);
      const itemType =
        record.itemType === PrismaSubServiceItemType.MAP
          ? SubServiceItemType.MAP
          : SubServiceItemType.CATEGORY;
      return this.mapCategoryToSubService(
        record.id,
        record.displayOrder ?? null,
        cat,
        itemType,
        record.displayName ?? null,
      );
    }
  }

  private mapTileToSubService(
    id: string,
    recordDisplayOrder: number | null,
    tile: any,
    displayNameOverride: string | null = null,
  ): SubServiceItemDto {
    const displayOrder = recordDisplayOrder ?? tile.displayOrder;
    return {
      id,
      itemType: SubServiceItemType.TILE,
      displayOrder,
      itemId: tile.id,
      slug: tile.slug,
      name: displayNameOverride ?? tile.header,
      subtitle: tile.subheader ?? null,
      description: tile.description ?? null,
      imageUrl: tile.backgroundImageUrl ?? null,
      iconUrl: tile.iconImageUrl ?? null,
      headerBackgroundColor: tile.headerBackgroundColor ?? null,
      contentBackgroundColor: tile.contentBackgroundColor ?? null,
      isActive: tile.isActive,
      createdAt: tile.createdAt.toISOString(),
      updatedAt: tile.updatedAt.toISOString(),
      websiteUrl: tile.websiteUrl ?? null,
      openInExternalBrowser: tile.openInExternalBrowser,
      publishAt: tile.publishAt?.toISOString() ?? null,
      expireAt: tile.expireAt?.toISOString() ?? null,
      createdByUserId: tile.createdByUserId ?? null,
      lastEditedByUserId: tile.lastEditedByUserId ?? null,
      cities: tile.cities.map((c: any) => ({
        id: c.id,
        cityId: c.cityId,
        isPrimary: c.isPrimary,
        displayOrder: c.displayOrder,
      })),
      type: null,
      parentId: null,
      viewType: null,
      children: null,
      isFavorite: null,
    };
  }

  private mapCategoryToSubService(
    id: string,
    recordDisplayOrder: number | null,
    cat: any,
    itemType: SubServiceItemType = SubServiceItemType.CATEGORY,
    displayNameOverride: string | null = null,
  ): SubServiceItemDto {
    const displayOrder = recordDisplayOrder ?? 0;
    return {
      id,
      itemType,
      displayOrder,
      itemId: cat.id,
      slug: cat.slug,
      name: displayNameOverride ?? cat.name,
      subtitle: cat.subtitle ?? null,
      description: cat.description ?? null,
      imageUrl: cat.imageUrl ?? null,
      iconUrl: cat.iconUrl ?? null,
      headerBackgroundColor: cat.headerBackgroundColor ?? null,
      contentBackgroundColor: cat.contentBackgroundColor ?? null,
      isActive: cat.isActive,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
      websiteUrl: null,
      openInExternalBrowser: null,
      publishAt: null,
      expireAt: null,
      createdByUserId: null,
      lastEditedByUserId: null,
      cities: null,
      type: cat.type ?? null,
      parentId: cat.parentId ?? null,
      viewType: cat.viewType ?? CategoryViewType.LISTINGS,
      children: (cat.children ?? []).map((child: any) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description ?? null,
        subtitle: child.subtitle ?? null,
        imageUrl: child.imageUrl ?? null,
        iconUrl: child.iconUrl ?? null,
        headerBackgroundColor: child.headerBackgroundColor ?? null,
        contentBackgroundColor: child.contentBackgroundColor ?? null,
        type: child.type ?? null,
        parentId: child.parentId ?? null,
        isActive: child.isActive,
        createdAt: child.createdAt.toISOString(),
        updatedAt: child.updatedAt.toISOString(),
      })) as CategoryResponseDto[],
      isFavorite: null,
    };
  }
}
