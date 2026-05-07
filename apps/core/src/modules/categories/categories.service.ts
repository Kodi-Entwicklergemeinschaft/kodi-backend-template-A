import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryQuickFilterDto,
  CategoryFilterDto,
  CategoryListResponseDto,
} from '@kodi/contracts';
import { CategoryRequestStatus, CategoryVisibility, Prisma } from '@prisma/client-core';
import { StorageService } from '@kodi/storage';
import { ConfigService } from '@kodi/config';
import { LoggerService } from '@kodi/logger';
import { RedisService } from '@kodi/redis';
import { TranslationService } from '@kodi/translations';
import { I18nService } from '@kodi/i18n';
import { CategoryQuickFiltersService } from './category-quick-filters.service';
import { SubServicesService } from './sub-services.service';

export interface ViewerContext {
  isAuthenticated: boolean;
  isGuest: boolean;
}

@Injectable()
export class CategoriesService {
  private static readonly CACHE_PREFIX_CITY_CATEGORIES = 'categories:city:';
  private static readonly CACHE_TTL_CITY_CATEGORIES = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
    private readonly translationService: TranslationService,
    private readonly i18nService: I18nService,
    private readonly quickFiltersService: CategoryQuickFiltersService,
    private readonly subServicesService: SubServicesService,
  ) {
    this.logger.setContext(CategoriesService.name);
  }

  /**
   * Invalidate all cached category trees. Called after any category CRUD operation.
   */
  private async invalidateCategoryCache(): Promise<void> {
    try {
      await this.redis.delPattern(`${CategoriesService.CACHE_PREFIX_CITY_CATEGORIES}*`);
    } catch (err) {
      this.logger.warn(`Failed to invalidate category cache: ${err}`);
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private buildVisibilityFilter(viewerContext?: ViewerContext): Prisma.CityCategoryWhereInput {
    if (!viewerContext?.isAuthenticated || viewerContext.isGuest) {
      return {
        visibility: { in: [CategoryVisibility.PUBLIC, CategoryVisibility.GUEST_ONLY] },
      };
    }
    return {
      visibility: { in: [CategoryVisibility.PUBLIC, CategoryVisibility.CITIZEN] },
    };
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 1) {
        return parts.slice(1).join('/');
      }
      return pathname.replace(/^\/[^\/]+\//, '');
    } catch (error) {
      this.logger.warn(`Failed to parse URL: ${url}`, error);
      return url.split('?')[0].replace(/^https?:\/\/[^\/]+\//, '');
    }
  }

  private async ensureUniqueCategorySlug(baseSlug: string, currentId?: string) {
    let candidate = baseSlug;
    let counter = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing || existing.id === currentId) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter++}`;
    }
  }

  /**
   * Build hierarchical category structure with children nested inside parents
   * Children inherit parent's imageUrl if their own imageUrl is null
   */
  private buildCategoryHierarchy(categories: any[]): any[] {
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];

    // First pass: Create a map of all categories and add children array
    categories.forEach((category) => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
      });
    });

    // Second pass: Build the hierarchy
    categories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id);

      if (category.parentId) {
        // This is a subcategory, add it to its parent's children array
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          // Parent not found in list, treat as root
          rootCategories.push(categoryWithChildren);
        }
      } else {
        // This is a root category
        rootCategories.push(categoryWithChildren);
      }
    });

    // Third pass: Propagate parent's imageUrl to children that don't have one
    const propagateImageUrl = (cat: any, parentImageUrl: string | null = null) => {
      // If this category doesn't have an imageUrl and parent has one, inherit it
      if (!cat.imageUrl && parentImageUrl) {
        cat.imageUrl = parentImageUrl;
      }

      // Use this category's imageUrl (or inherited one) for its children
      const imageUrlToPropagate = cat.imageUrl || parentImageUrl;

      // Recursively propagate to children
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach((child: any) => {
          propagateImageUrl(child, imageUrlToPropagate);
        });
      }
    };

    // Start propagation from root categories
    rootCategories.forEach((cat) => propagateImageUrl(cat));

    // Remove empty children arrays for cleaner output
    const removeEmptyChildren = (cat: any) => {
      if (cat.children && cat.children.length === 0) {
        delete cat.children;
      } else if (cat.children && cat.children.length > 0) {
        cat.children.forEach(removeEmptyChildren);
      }
    };

    rootCategories.forEach(removeEmptyChildren);

    return rootCategories;
  }

  /**
   * For city category lists, only categories whose parent chain is fully present in the
   * assigned set should participate in the tree. If a parent (e.g. kodier-woche-events)
   * is not assigned to the city but a child is, {@link buildCategoryHierarchy} would
   * otherwise promote that child to a root. This method drops such nodes, iteratively,
   * so grandchildren are also excluded when an intermediate parent is dropped.
   */
  private excludeCategoriesWithMissingParentInCity<
    T extends { id: string; parentId: string | null },
  >(categories: T[]): T[] {
    let working = [...categories];
    let changed = true;
    while (changed) {
      changed = false;
      const ids = new Set(working.map((c) => c.id));
      const next = working.filter((c) => !c.parentId || ids.has(c.parentId));
      if (next.length !== working.length) {
        changed = true;
      }
      working = next;
    }
    return working;
  }

  /**
   * Fetch and attach children to parent categories
   * Also handles imageUrl inheritance (children inherit parent's imageUrl if their own is null)
   * Only includes active children by default, unless showAll is true
   */
  private async attachChildrenToCategories(
    categories: any[],
    showAll: boolean = false,
  ): Promise<any[]> {
    if (categories.length === 0) return categories;

    const categoryIds = categories.map((c) => c.id);
    const children = await this.prisma.category.findMany({
      where: {
        parentId: { in: categoryIds },
        ...(showAll ? {} : { isActive: true }),
      },
      orderBy: [{ name: 'asc' }],
    });

    // Group children by parentId
    const childrenByParentId = new Map<string, typeof children>();
    children.forEach((child) => {
      if (child.parentId) {
        const existing = childrenByParentId.get(child.parentId) || [];
        existing.push(child);
        childrenByParentId.set(child.parentId, existing);
      }
    });

    // Attach children to their parents with imageUrl inheritance
    return categories.map((cat) => {
      const catChildren = childrenByParentId.get(cat.id) || [];

      // Apply imageUrl inheritance: children without imageUrl inherit from parent
      const childrenWithInheritedImageUrl = catChildren.map((child) => ({
        ...child,
        imageUrl: child.imageUrl || cat.imageUrl,
      }));

      // Only include children property if there are children
      if (childrenWithInheritedImageUrl.length > 0) {
        return {
          ...cat,
          children: childrenWithInheritedImageUrl,
        };
      }
      return cat;
    });
  }

  /**
   * Apply translations to a category node and its children
   */
  private async translateCategoryTree(categories: any[]): Promise<any[]> {
    const locale = this.i18nService.getLanguage();
    const defaultSourceLocale = this.configService.get<string>('i18n.defaultLanguage', 'en');

    this.logger.debug(
      `translateCategoryTree: locale=${locale}, defaultSourceLocale=${defaultSourceLocale}, categoriesCount=${categories.length}`,
    );

    // If no locale requested, return without translation
    if (!locale) {
      this.logger.debug(`Skipping translation: no locale requested`);
      return categories;
    }

    // Step 1: Flatten tree to collect all entity descriptors
    const entities: Array<{ entityType: string; entityId: string }> = [];
    const collectEntities = (nodes: any[]) => {
      for (const cat of nodes) {
        const sourceLocale = cat.languageCode || defaultSourceLocale;
        if (locale !== sourceLocale) {
          const entityType = cat.hasCityOverride ? 'city-category' : 'category';
          const entityId = cat.hasCityOverride ? `${cat.cityId}:${cat.id}` : cat.id;
          entities.push({ entityType, entityId });
        }
        if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
          collectEntities(cat.children);
        }
      }
    };
    collectEntities(categories);

    // Step 2: One query for all translations
    const translationMap = await this.translationService.prefetchTranslations(entities, locale);

    // Step 3: Apply synchronously during tree traversal
    const translateNode = (category: any): any => {
      const sourceLocale = category.languageCode || defaultSourceLocale;

      let name = category.name;
      let description = category.description;
      let subtitle = category.subtitle;

      if (locale !== sourceLocale) {
        const entityType = category.hasCityOverride ? 'city-category' : 'category';
        const entityId = category.hasCityOverride
          ? `${category.cityId}:${category.id}`
          : category.id;

        name = this.translationService.getTranslationFromMap(
          translationMap,
          entityType,
          entityId,
          'name',
          locale,
          category.name,
          sourceLocale,
        );
        description = this.translationService.getTranslationFromMap(
          translationMap,
          entityType,
          entityId,
          'description',
          locale,
          category.description ?? '',
          sourceLocale,
        );
        subtitle = this.translationService.getTranslationFromMap(
          translationMap,
          entityType,
          entityId,
          'subtitle',
          locale,
          category.subtitle ?? '',
          sourceLocale,
        );
      }

      let children: any[] | undefined;
      if (category.children && Array.isArray(category.children)) {
        children = category.children.map(translateNode);
      }

      return {
        ...category,
        name,
        description,
        subtitle,
        ...(children ? { children } : {}),
      };
    };

    return categories.map(translateNode);
  }

  async listCategories(
    filter?: CategoryFilterDto,
    showAll: boolean = false,
  ): Promise<CategoryListResponseDto | CategoryResponseDto[]> {
    // Determine if we should only return root categories (default: true)
    // rootOnly=true means: only fetch root categories (parentId=null), then attach their children
    // rootOnly=false means: fetch all categories matching the filter (flat list for hierarchy building)
    const rootOnly = filter?.rootOnly !== false;

    // Build where clause for filtering
    const where: Prisma.CategoryWhereInput = {};

    // Search filter - search in name, description, and subtitle
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { subtitle: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // Type filter
    if (filter?.type) {
      where.type = filter.type;
    }

    // Parent ID filter - takes precedence over rootOnly
    if (filter?.parentId !== undefined) {
      if (filter.parentId === null || filter.parentId === '') {
        // Explicitly filter for root categories (no parent)
        where.parentId = null;
      } else {
        where.parentId = filter.parentId;
      }
    } else if (rootOnly) {
      // Default behavior: only return root categories (main categories)
      where.parentId = null;
    }

    // Active status filter - only apply if showAll is false and isActive is not explicitly set
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    } else if (!showAll) {
      // Default: only show active categories unless showAll is true
      where.isActive = true;
    }

    // Category IDs filter
    if (filter?.categoryIds && filter.categoryIds.length > 0) {
      where.id = { in: filter.categoryIds };
    }

    // Exclude children of inactive parents (only when not showing all):
    // - include all root categories (parentId = null)
    // - include non-root categories only if their parent is active
    const andConditions: Prisma.CategoryWhereInput[] = [];
    if (where.AND) {
      andConditions.push(...(Array.isArray(where.AND) ? where.AND : [where.AND]));
    }
    if (!showAll) {
      andConditions.push({
        OR: [{ parentId: null }, { parent: { isActive: true } }],
      });
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Build orderBy clause
    const orderBy: Prisma.CategoryOrderByWithRelationInput[] = [];
    if (filter?.sortBy) {
      const direction = filter.sortDirection === 'desc' ? 'desc' : 'asc';
      orderBy.push({ [filter.sortBy]: direction });
    } else {
      // Default ordering
      orderBy.push({ type: 'asc' }, { name: 'asc' });
    }

    // Handle pagination
    const page = filter?.page && filter.page > 0 ? filter.page : 1;
    const pageSize = filter?.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 20;
    const skip = (page - 1) * pageSize;

    // If pagination is requested, return paginated response
    if (filter?.page || filter?.pageSize) {
      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
        }),
        this.prisma.category.count({ where }),
      ]);

      // If rootOnly, fetch children for each root category
      let categoriesWithChildren: any[] = categories;
      if (rootOnly && categories.length > 0) {
        categoriesWithChildren = await this.attachChildrenToCategories(categories, showAll);
      }

      const tree = rootOnly
        ? categoriesWithChildren
        : this.buildCategoryHierarchy(categoriesWithChildren);
      const translatedTree = await this.translateCategoryTree(tree);

      const totalPages = Math.ceil(total / pageSize);

      return {
        items: translatedTree,
        meta: {
          page,
          pageSize,
          total,
          totalPages,
        },
      };
    }

    // If no pagination, return all categories as before (for backward compatibility)
    const categories = await this.prisma.category.findMany({
      where,
      orderBy,
    });

    // If rootOnly, fetch children for each root category
    let categoriesWithChildren: any[] = categories;
    if (rootOnly && categories.length > 0) {
      categoriesWithChildren = await this.attachChildrenToCategories(categories, showAll);
    }

    const tree = rootOnly
      ? categoriesWithChildren
      : this.buildCategoryHierarchy(categoriesWithChildren);
    return this.translateCategoryTree(tree);
  }

  /**
   * Get all main/root categories (categories without a parent)
   * Returns a flat list without subcategories nested
   */
  async listMainCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return this.translateCategoryTree(categories);
  }

  async createCategory(dto: CreateCategoryDto, createdBy?: string) {
    const baseSlugCandidate = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    const baseSlug = baseSlugCandidate || this.slugify(`${dto.name}-${Date.now()}`);
    const slug = await this.ensureUniqueCategorySlug(baseSlug);

    // Determine source language: use current request language or default
    const sourceLanguage =
      this.i18nService.getLanguage() ||
      this.configService.get<string>('i18n.defaultLanguage', 'en');

    const data: Prisma.CategoryCreateInput = {
      name: dto.name,
      slug,
      description: dto.description ?? null,
      subtitle: dto.subtitle ?? null,
      type: dto.type ?? null,
      languageCode: sourceLanguage,
      isActive: true, // Always set to true for main category
      headerBackgroundColor: dto.headerBackgroundColor ?? null,
      contentBackgroundColor: dto.contentBackgroundColor ?? null,
      viewType: (dto.viewType as any) ?? 'LISTINGS',
    };

    if (dto.parentId) {
      data.parent = {
        connect: { id: dto.parentId },
      };
    }

    const category = await this.prisma.category.create({ data });

    // If cities are provided, create city_category mappings
    if (dto.cities && dto.cities.length > 0) {
      const cityCategoryData = dto.cities.map((city) => ({
        cityId: city.cityId,
        categoryId: category.id,
        addedBy: createdBy ?? null,
        isActive: dto.isActive ?? true,
      }));

      await this.prisma.cityCategory.createMany({
        data: cityCategoryData,
        skipDuplicates: true,
      });
    }

    await this.invalidateCategoryCache();
    return category;
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const updateData: Prisma.CategoryUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.slug !== undefined) {
      const baseSlug = this.slugify(dto.slug);
      updateData.slug = await this.ensureUniqueCategorySlug(baseSlug, categoryId);
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.subtitle !== undefined) {
      updateData.subtitle = dto.subtitle;
    }

    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }

    if (dto.parentId !== undefined) {
      updateData.parent = dto.parentId
        ? {
            connect: { id: dto.parentId },
          }
        : { disconnect: true };
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    if (dto.headerBackgroundColor !== undefined) {
      updateData.headerBackgroundColor = dto.headerBackgroundColor;
    }

    if (dto.contentBackgroundColor !== undefined) {
      updateData.contentBackgroundColor = dto.contentBackgroundColor;
    }

    if (dto.viewType !== undefined) {
      (updateData as any).viewType = dto.viewType;
    }

    const result = await this.prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    });
    await this.invalidateCategoryCache();
    return result;
  }

  async deleteCategory(categoryId: string) {
    const usageCount = await this.prisma.listingCategory.count({
      where: { categoryId },
    });

    if (usageCount > 0) {
      throw new BadRequestException({ errorCode: 'CATEGORY_IN_USE' });
    }

    // Get category to check for images
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException({ errorCode: 'CATEGORY_NOT_FOUND' });
    }

    // Delete image from storage if exists
    if (category.imageUrl) {
      try {
        const key = this.extractKeyFromUrl(category.imageUrl);
        const bucket = this.configService.storageConfig.defaultBucket;
        if (bucket) {
          await this.storageService.deleteFile({ bucket, key });
        }
      } catch (error) {
        this.logger.warn(`Failed to delete image for category ${categoryId}`, error);
      }
    }

    // Delete icon from storage if exists
    if (category.iconUrl) {
      try {
        const key = this.extractKeyFromUrl(category.iconUrl);
        const bucket = this.configService.storageConfig.defaultBucket;
        if (bucket) {
          await this.storageService.deleteFile({ bucket, key });
        }
      } catch (error) {
        this.logger.warn(`Failed to delete icon for category ${categoryId}`, error);
      }
    }

    const result = await this.prisma.category.delete({
      where: { id: categoryId },
    });
    await this.invalidateCategoryCache();
    return result;
  }

  async listCityCategories(
    cityId: string,
    filter?: CategoryFilterDto,
    showAll: boolean = false,
    viewerContext?: ViewerContext,
  ): Promise<CategoryListResponseDto | CategoryResponseDto[]> {
    // When showAll is true, return every city category regardless of visibility (guest/citizen/public).
    const visibilityFilter = showAll ? {} : this.buildVisibilityFilter(viewerContext);

    // First, get all CityCategory entries for this city including city-specific overrides
    const cityCategories = await this.prisma.cityCategory.findMany({
      where: {
        cityId,
        ...(showAll ? {} : { isActive: true }),
        ...visibilityFilter,
      },
      select: {
        categoryId: true,
        displayOrder: true,
        displayName: true,
        description: true,
        subtitle: true,
        languageCode: true,
        imageUrl: true,
        iconUrl: true,
        headerBackgroundColor: true,
        contentBackgroundColor: true,
        isActive: true,
      },
    });

    // Create a map for quick lookup of city-specific overrides
    const cityCategoryMap = new Map<string, (typeof cityCategories)[number]>();
    cityCategories.forEach((cc) => {
      cityCategoryMap.set(cc.categoryId, cc);
    });

    // Get all category IDs that are explicitly assigned to this city
    const assignedCategoryIds = cityCategories.map((cc) => cc.categoryId);

    // Only fetch categories that are explicitly assigned via CityCategory
    // and exclude children of inactive parents or parents not assigned to this city (when not showing all):
    // - include all root categories (parentId = null)
    // - include non-root categories only if:
    //   - their parent category is active AND
    //   - their parent is also assigned to this city (has active CityCategory)
    const categoryWhereCondition: Prisma.CategoryWhereInput = {
      id: { in: assignedCategoryIds },
      ...(showAll ? {} : { isActive: true }),
    };

    // Only add the parent active check when not showing all
    if (!showAll) {
      categoryWhereCondition.AND = [
        {
          OR: [
            { parentId: null },
            {
              AND: [{ parent: { isActive: true } }, { parentId: { in: assignedCategoryIds } }],
            },
          ],
        },
      ];
    }

    const categories = await this.prisma.category.findMany({
      where: categoryWhereCondition,
    });

    // Merge CityCategory overrides with base Category data
    // CityCategory fields take precedence over base Category fields when not null
    const categoriesWithOrder = categories.map((category) => {
      const cityOverrides = cityCategoryMap.get(category.id);
      const hasCityOverride = Boolean(cityOverrides?.displayName);
      return {
        ...category,
        // Use city-specific values if they exist, otherwise fall back to base category values
        name: cityOverrides?.displayName || category.name,
        description: cityOverrides?.description ?? category.description,
        subtitle: cityOverrides?.subtitle ?? category.subtitle,
        imageUrl: cityOverrides?.imageUrl || category.imageUrl,
        iconUrl: cityOverrides?.iconUrl || category.iconUrl,
        headerBackgroundColor:
          cityOverrides?.headerBackgroundColor || category.headerBackgroundColor,
        contentBackgroundColor:
          cityOverrides?.contentBackgroundColor || category.contentBackgroundColor,
        // Use CityCategory's languageCode for translation source if available
        languageCode: cityOverrides?.languageCode || category.languageCode,
        cityCategoryDisplayOrder: cityOverrides?.displayOrder,
        // Use CityCategory's isActive status (city-specific active state)
        isActive: cityOverrides?.isActive ?? category.isActive,
        // Flag to indicate this category has city-specific text that needs city-specific translation
        hasCityOverride,
        cityId, // Pass cityId for translation lookup
        viewType: category.viewType ?? 'LISTINGS',
      };
    });

    // Sort categories using caller-provided sortBy when available; otherwise fallback to displayOrder
    const sortedCategories = [...categoriesWithOrder].sort((a, b) => {
      if (filter?.sortBy) {
        const dir = filter.sortDirection === 'desc' ? -1 : 1;
        const field = filter.sortBy as keyof typeof a;
        const valA = a[field] as any;
        const valB = b[field] as any;

        // Handle equality and nulls
        if (valA === valB) {
          // tie-breaker: displayOrder then name
          const orderA = a.cityCategoryDisplayOrder ?? 100;
          const orderB = b.cityCategoryDisplayOrder ?? 100;
          if (orderA === orderB) {
            return (a.name || '').localeCompare(b.name || '');
          }
          return orderA - orderB;
        }
        if (valA === null || valA === undefined) return 1 * dir;
        if (valB === null || valB === undefined) return -1 * dir;
        return valA < valB ? -1 * dir : 1 * dir;
      }

      // Default: displayOrder, then name
      const orderA = a.cityCategoryDisplayOrder ?? 100;
      const orderB = b.cityCategoryDisplayOrder ?? 100;
      if (orderA === orderB) {
        return (a.name || '').localeCompare(b.name || '');
      }
      return orderA - orderB;
    });

    const categoriesForTree = this.excludeCategoriesWithMissingParentInCity(sortedCategories);

    // Build hierarchy
    const tree = this.buildCategoryHierarchy(categoriesForTree);

    // Apply search filter (search in name, description, subtitle on root and children)
    let filteredTree = tree;
    if (filter?.search) {
      const term = filter.search.toLowerCase();
      const nodeMatches = (category: any): boolean => {
        const text =
          (category.name || '') +
          ' ' +
          (category.description || '') +
          ' ' +
          (category.subtitle || '');
        if (text.toLowerCase().includes(term)) {
          return true;
        }
        if (category.children && Array.isArray(category.children)) {
          return category.children.some((child: any) => nodeMatches(child));
        }
        return false;
      };
      filteredTree = tree.filter((category) => nodeMatches(category));
    }

    // Handle pagination similar to listCategories
    if (filter?.page || filter?.pageSize) {
      const page = filter?.page && filter.page > 0 ? filter.page : 1;
      const pageSize =
        filter?.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 20;
      const total = filteredTree.length;
      const totalPages = Math.ceil(total / pageSize);
      const skip = (page - 1) * pageSize;
      const pagedItems = filteredTree.slice(skip, skip + pageSize);
      const translatedItems = await this.translateCategoryTree(pagedItems);

      return {
        items: translatedItems,
        meta: {
          page,
          pageSize,
          total,
          totalPages,
        },
      };
    }

    // No pagination: check cache, then translate full filtered tree
    const locale = this.i18nService.getLanguage() || 'default';
    const visKey = showAll
      ? 'all'
      : viewerContext?.isAuthenticated && !viewerContext.isGuest
        ? 'citizen'
        : 'public';
    const cacheKey = `${CategoriesService.CACHE_PREFIX_CITY_CATEGORIES}${cityId}:${locale}:${visKey}`;

    const cached = await this.redis.get<CategoryResponseDto[]>(cacheKey);
    if (cached) return cached;

    const translated = await this.translateCategoryTree(filteredTree);
    await this.redis.set(cacheKey, translated, CategoriesService.CACHE_TTL_CITY_CATEGORIES);
    return translated;
  }

  /**
   * Attach virtual quick-filter children to root categories in the tree.
   * Virtual children are marked with isQuickFilter=true and contain quickFilter.
   * Quick filters and subcategories are merged and sorted together by order:
   * - Quick filters with order 0 (e.g., "nearby") appear first
   * - Subcategories appear in the middle (using displayOrder from CityCategory, default 100)
   * - Quick filters with order 999 (e.g., "see all") appear last
   */
  private attachQuickFilterChildren(
    categories: any[],
    quickFiltersByCategorySlug: Record<string, CategoryQuickFilterDto[]>,
  ): void {
    for (const category of categories) {
      if ((category as any).viewType === 'SUB_SERVICES') continue;
      // Only attach to root categories (no parentId)
      if (!category.parentId) {
        const quickFilters = quickFiltersByCategorySlug[category.slug];

        // Get existing subcategories (real children) and assign order from CityCategory displayOrder
        const existingChildren = (category.children || []).map((child: any) => ({
          ...child,
          order: child.cityCategoryDisplayOrder ?? 100, // Use CityCategory displayOrder, default to 100
        }));

        if (quickFilters && quickFilters.length > 0) {
          // Sort quick filters by order
          const sortedFilters = [...quickFilters].sort((a, b) => a.order - b.order);

          // Create virtual child nodes for each quick filter
          const virtualChildren = sortedFilters.map((filter) => ({
            id: `quick-${category.slug}-${filter.key}`,
            name: filter.label,
            slug: `${category.slug}__${filter.key}`,
            description: null,
            subtitle: null,
            imageUrl: filter.imageUrl ?? null,
            iconUrl: null,
            headerBackgroundColor: null,
            contentBackgroundColor: null,
            type: null,
            parentId: category.id,
            languageCode: null,
            isActive: true,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            isQuickFilter: true,
            quickFilter: filter.key,
            radiusMeters: filter.radiusMeters ?? null,
            order: filter.order,
          }));

          // Merge quick filters and subcategories
          const allChildren = [...virtualChildren, ...existingChildren];

          // Sort all children by order
          allChildren.sort((a, b) => {
            const orderA = a.order ?? 100;
            const orderB = b.order ?? 100;
            // If order is the same, sort by name for consistency
            if (orderA === orderB) {
              return (a.name || '').localeCompare(b.name || '');
            }
            return orderA - orderB;
          });

          // Replace children array with sorted merged array
          category.children = allChildren;
        } else {
          // No quick filters, but sort subcategories by displayOrder
          existingChildren.sort((a: any, b: any) => {
            const orderA = a.order ?? 100;
            const orderB = b.order ?? 100;
            if (orderA === orderB) {
              return (a.name || '').localeCompare(b.name || '');
            }
            return orderA - orderB;
          });
          category.children = existingChildren;
        }
      }

      // Recursively process children (in case we want to support nested quick filters later)
      if (category.children && Array.isArray(category.children)) {
        this.attachQuickFilterChildren(category.children, quickFiltersByCategorySlug);
      }
    }
  }

  /**
   * Translate name/subtitle/description on sub-service items.
   * Category / MAP items and their nested Category children use the same rules as translateCategoryTree:
   * when a CityCategory row exists with displayName for this city, entityType is 'city-category' and
   * entityId is '{cityId}:{categoryId}'; otherwise entityType is 'category' and entityId is the category id.
   * Tile items use entityType 'tile' with field 'header' for the display name.
   */
  private async translateSubServiceItems(subServices: any[], cityId: string): Promise<void> {
    const locale = this.i18nService.getLanguage();
    if (!locale) return;

    const defaultSourceLocale = this.configService.get<string>('i18n.defaultLanguage', 'en');

    const topLevelCatIds = [
      ...new Set(
        subServices
          .filter((i) => i.itemType === 'CATEGORY' || i.itemType === 'MAP')
          .map((i) => i.itemId as string),
      ),
    ];
    const childCatIds = [
      ...new Set(
        subServices.flatMap((i) => {
          if (i.itemType !== 'CATEGORY' && i.itemType !== 'MAP') return [];
          const ch = i.children;
          if (!Array.isArray(ch) || ch.length === 0) return [];
          return ch
            .filter((c: any) => c && !c.isQuickFilter && typeof c.id === 'string')
            .map((c: any) => c.id as string);
        }),
      ),
    ];
    const catIds = [...new Set([...topLevelCatIds, ...childCatIds])];
    const tileIds = [
      ...new Set(subServices.filter((i) => i.itemType === 'TILE').map((i) => i.itemId as string)),
    ];

    const [cats, tiles, cityCategories] = await Promise.all([
      catIds.length
        ? this.prisma.category.findMany({
            where: { id: { in: catIds } },
            select: { id: true, languageCode: true },
          })
        : Promise.resolve([]),
      tileIds.length
        ? this.prisma.tile.findMany({
            where: { id: { in: tileIds } },
            select: { id: true, languageCode: true },
          })
        : Promise.resolve([]),
      catIds.length
        ? this.prisma.cityCategory.findMany({
            where: { cityId, categoryId: { in: catIds }, isActive: true },
            select: { categoryId: true, languageCode: true, displayName: true },
          })
        : Promise.resolve([]),
    ]);

    const catLangMap = new Map<string, string>(
      cats.map((c) => [c.id, c.languageCode ?? defaultSourceLocale] as [string, string]),
    );
    const tileLangMap = new Map<string, string>(
      tiles.map((t) => [t.id, t.languageCode ?? defaultSourceLocale] as [string, string]),
    );
    const cityCategoryByCatId = new Map(
      cityCategories.map((cc) => [cc.categoryId, cc] as [string, (typeof cityCategories)[0]]),
    );

    /** Matches listCityCategories merge: hasCityOverride iff CityCategory has displayName. */
    const resolveCategoryTranslationTarget = (
      categoryId: string,
    ): { entityType: string; entityId: string; sourceLocale: string } => {
      const cc = cityCategoryByCatId.get(categoryId);
      const baseLang = catLangMap.get(categoryId) ?? defaultSourceLocale;
      const hasCityOverride = Boolean(cc?.displayName);
      if (hasCityOverride) {
        return {
          entityType: 'city-category',
          entityId: `${cityId}:${categoryId}`,
          sourceLocale: cc?.languageCode || baseLang,
        };
      }
      return {
        entityType: 'category',
        entityId: categoryId,
        sourceLocale: baseLang,
      };
    };

    const entities: Array<{ entityType: string; entityId: string }> = [];
    const seenEntity = new Set<string>();
    const pushEntity = (entityType: string, entityId: string, sourceLocale: string) => {
      if (locale === sourceLocale) return;
      const key = `${entityType}:${entityId}`;
      if (seenEntity.has(key)) return;
      seenEntity.add(key);
      entities.push({ entityType, entityId });
    };

    for (const item of subServices) {
      if (item.itemType === 'CATEGORY' || item.itemType === 'MAP') {
        const t = resolveCategoryTranslationTarget(item.itemId);
        pushEntity(t.entityType, t.entityId, t.sourceLocale);
        if (Array.isArray(item.children)) {
          for (const child of item.children) {
            if (!child?.id || child.isQuickFilter) continue;
            const ct = resolveCategoryTranslationTarget(child.id);
            pushEntity(ct.entityType, ct.entityId, ct.sourceLocale);
          }
        }
      } else if (item.itemType === 'TILE') {
        const src = tileLangMap.get(item.itemId) ?? defaultSourceLocale;
        pushEntity('tile', item.itemId, src);
      }
    }

    if (!entities.length) return;

    const translationMap = await this.translationService.prefetchTranslations(entities, locale);

    const translateCategoryFields = (categoryId: string, node: any): void => {
      const { entityType, entityId, sourceLocale } = resolveCategoryTranslationTarget(categoryId);
      if (locale === sourceLocale) return;
      node.name = this.translationService.getTranslationFromMap(
        translationMap,
        entityType,
        entityId,
        'name',
        locale,
        node.name,
        sourceLocale,
      );
      node.subtitle = this.translationService.getTranslationFromMap(
        translationMap,
        entityType,
        entityId,
        'subtitle',
        locale,
        node.subtitle ?? '',
        sourceLocale,
      );
      node.description = this.translationService.getTranslationFromMap(
        translationMap,
        entityType,
        entityId,
        'description',
        locale,
        node.description ?? '',
        sourceLocale,
      );
    };

    for (const item of subServices) {
      if (item.itemType === 'CATEGORY' || item.itemType === 'MAP') {
        translateCategoryFields(item.itemId, item);
        if (Array.isArray(item.children)) {
          for (const child of item.children) {
            if (!child?.id || child.isQuickFilter) continue;
            translateCategoryFields(child.id, child);
          }
        }
      } else if (item.itemType === 'TILE') {
        const src = tileLangMap.get(item.itemId) ?? defaultSourceLocale;
        if (locale === src) continue;
        // Tile DB fields: header → name, subheader → subtitle, description → description
        item.name = this.translationService.getTranslationFromMap(
          translationMap,
          'tile',
          item.itemId,
          'header',
          locale,
          item.name,
          src,
        );
        item.subtitle = this.translationService.getTranslationFromMap(
          translationMap,
          'tile',
          item.itemId,
          'subheader',
          locale,
          item.subtitle ?? '',
          src,
        );
        item.description = this.translationService.getTranslationFromMap(
          translationMap,
          'tile',
          item.itemId,
          'description',
          locale,
          item.description ?? '',
          src,
        );
      }
    }
  }

  /**
   * Merge quick-filter virtual children into CATEGORY / MAP sub-service items.
   * Each sub-service that references a category slug with configured quick filters
   * gets those filters injected into its children array (same shape as attachQuickFilterChildren).
   */
  private attachQuickFiltersToSubServices(
    subServices: any[],
    quickFiltersByCategorySlug: Record<string, CategoryQuickFilterDto[]>,
  ): void {
    for (const item of subServices) {
      if (item.itemType !== 'CATEGORY' && item.itemType !== 'MAP') continue;
      const slug: string | undefined = item.slug;
      if (!slug) continue;

      const quickFilters = quickFiltersByCategorySlug[slug];
      if (!quickFilters || quickFilters.length === 0) continue;

      const sortedFilters = [...quickFilters].sort((a, b) => a.order - b.order);

      const virtualChildren = sortedFilters.map((filter) => ({
        id: `quick-${slug}-${filter.key}`,
        name: filter.label,
        slug: `${slug}__${filter.key}`,
        description: null,
        subtitle: null,
        imageUrl: filter.imageUrl ?? null,
        iconUrl: null,
        headerBackgroundColor: null,
        contentBackgroundColor: null,
        type: null,
        parentId: item.itemId,
        languageCode: null,
        isActive: true,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        isQuickFilter: true,
        quickFilter: filter.key,
        radiusMeters: filter.radiusMeters ?? null,
        order: filter.order,
      }));

      const existingChildren = (item.children || []).map((child: any) => ({
        ...child,
        order: child.order ?? 100,
      }));

      const allChildren = [...virtualChildren, ...existingChildren];
      allChildren.sort((a, b) => {
        const orderA = a.order ?? 100;
        const orderB = b.order ?? 100;
        if (orderA === orderB) {
          return (a.name || '').localeCompare(b.name || '');
        }
        return orderA - orderB;
      });

      item.children = allChildren;
    }
  }

  /**
   * Check which categories have at least one favorited listing.
   * Returns a Set of category IDs that have favorited listings.
   */
  private async getCategoriesWithFavorites(
    userId: string,
    categoryIds: string[],
  ): Promise<Set<string>> {
    if (!categoryIds.length) {
      return new Set();
    }

    // Get all listings for these categories
    const listingCategories = await this.prisma.listingCategory.findMany({
      where: {
        categoryId: { in: categoryIds },
      },
      select: {
        listingId: true,
        categoryId: true,
      },
    });

    if (!listingCategories.length) {
      return new Set();
    }

    // Get user's favorite listing IDs
    const listingIds = [...new Set(listingCategories.map((lc) => lc.listingId))];
    const favorites = await this.prisma.userFavorite.findMany({
      where: {
        userId,
        listingId: { in: listingIds },
      },
      select: { listingId: true },
    });

    const favoriteListingIds = new Set(favorites.map((f) => f.listingId));

    // Find categories that have at least one favorited listing
    const categoriesWithFavorites = new Set<string>();
    for (const lc of listingCategories) {
      if (favoriteListingIds.has(lc.listingId)) {
        categoriesWithFavorites.add(lc.categoryId);
      }
    }

    return categoriesWithFavorites;
  }

  /**
   * Recursively collect all category IDs from the category tree.
   * Excludes quick filter virtual nodes.
   */
  private collectCategoryIds(categories: any[]): string[] {
    const ids: string[] = [];

    for (const category of categories) {
      // Skip quick filter virtual nodes
      if (category.isQuickFilter) {
        continue;
      }

      ids.push(category.id);

      // Recursively collect children
      if (category.children && Array.isArray(category.children)) {
        ids.push(...this.collectCategoryIds(category.children));
      }
    }

    return ids;
  }

  /**
   * Recursively set isFavorite flag on categories.
   * If a child category has isFavorite=true, the parent should also have isFavorite=true.
   */
  private setCategoryFavoriteFlags(categories: any[], categoriesWithFavorites: Set<string>): void {
    for (const category of categories) {
      // Skip quick filter virtual nodes
      if (category.isQuickFilter) {
        continue;
      }

      // Check if this category has favorited listings
      let hasFavorite = categoriesWithFavorites.has(category.id);

      // Recursively process children first
      if (category.children && Array.isArray(category.children)) {
        this.setCategoryFavoriteFlags(category.children, categoriesWithFavorites);

        // If any child has isFavorite=true, parent should also be true
        const childHasFavorite = category.children.some(
          (child: any) => !child.isQuickFilter && child.isFavorite === true,
        );
        hasFavorite = hasFavorite || childHasFavorite;
      }

      // Set the flag
      category.isFavorite = hasFavorite;
    }
  }

  /**
   * List city categories with quick filters attached as virtual children.
   * Quick filters (Nearby, See all) are embedded in the children array of root categories,
   * marked with isQuickFilter=true for easy identification by the app.
   */
  async listCityCategoriesWithFilters(
    cityId: string,
    userId?: string,
    viewerContext?: ViewerContext,
  ): Promise<CategoryResponseDto[]> {
    const result = await this.listCityCategories(cityId, undefined, false, viewerContext);
    const categories = Array.isArray(result) ? result : result.items;
    const quickFiltersByCategorySlug =
      await this.quickFiltersService.getQuickFiltersForCity(cityId);

    // Eager-load sub-services for SUB_SERVICES categories
    const subServiceCategoryIds = categories
      .filter((cat) => (cat as any).viewType === 'SUB_SERVICES')
      .map((cat) => cat.id);

    if (subServiceCategoryIds.length > 0) {
      const subServicesMap = await this.subServicesService.loadSubServicesForCategories(
        subServiceCategoryIds,
        cityId,
      );
      for (const cat of categories) {
        if ((cat as any).viewType === 'SUB_SERVICES') {
          const subServices = subServicesMap.get(cat.id) ?? [];
          await this.translateSubServiceItems(subServices, cityId);
          this.attachQuickFiltersToSubServices(subServices, quickFiltersByCategorySlug);
          (cat as any).subServices = subServices;
        }
      }
    }

    // Attach virtual quick-filter children to LISTINGS categories (existing behavior)
    this.attachQuickFilterChildren(categories, quickFiltersByCategorySlug);

    // If user is logged in, check favorites and set isFavorite flags
    if (userId) {
      const categoryIds = this.collectCategoryIds(categories);
      const categoriesWithFavorites = await this.getCategoriesWithFavorites(userId, categoryIds);
      this.setCategoryFavoriteFlags(categories, categoriesWithFavorites);
    }

    return categories;
  }

  async getCategoryById(categoryId: string, showAll: boolean = false) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException({ errorCode: 'CATEGORY_NOT_FOUND' });
    }

    // Get subcategories (children) - all or only active based on showAll parameter
    const children = await this.prisma.category.findMany({
      where: {
        parentId: categoryId,
        ...(showAll ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    // Propagate parent's imageUrl to children that don't have one
    const childrenWithInheritedImageUrl = children.map((child) => ({
      ...child,
      imageUrl: child.imageUrl || category.imageUrl,
    }));

    const tree = await this.translateCategoryTree([
      {
        ...category,
        ...(childrenWithInheritedImageUrl.length > 0
          ? { children: childrenWithInheritedImageUrl }
          : {}),
      },
    ]);

    return tree[0];
  }

  /**
   * Transform CityCategory response:
   * - Rename displayName to name
   * - Use categoryId as id, remove categoryId field
   */
  private transformCityCategoryResponse(cityCategory: any): any {
    if (!cityCategory) return cityCategory;
    const { displayName, categoryId, id: _originalId, ...rest } = cityCategory;
    return {
      id: categoryId,
      ...rest,
      name: displayName,
    };
  }

  async assignCategoryToCity(cityId: string, categoryId: string, addedBy: string, name?: string) {
    const result = await this.prisma.cityCategory.upsert({
      where: {
        cityId_categoryId: {
          cityId,
          categoryId,
        },
      },
      update: {
        isActive: true,
        addedBy,
        addedAt: new Date(),
        displayName: name !== undefined ? name : undefined, // Only update if provided
      },
      create: {
        cityId,
        categoryId,
        addedBy,
        displayName: name ?? null, // Default to null if not provided
      },
      include: {
        category: true,
      },
    });
    return this.transformCityCategoryResponse(result);
  }

  async removeCategoryFromCity(cityId: string, categoryId: string) {
    const existing = await this.prisma.cityCategory.findUnique({
      where: {
        cityId_categoryId: {
          cityId,
          categoryId,
        },
      },
      include: {
        category: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({ errorCode: 'CITY_CATEGORY_MAPPING_NOT_FOUND' });
    }

    if (!existing.isActive) {
      return this.transformCityCategoryResponse(existing);
    }

    const result = await this.prisma.cityCategory.update({
      where: {
        cityId_categoryId: {
          cityId,
          categoryId,
        },
      },
      data: {
        isActive: false,
      },
      include: {
        category: true,
      },
    });
    return this.transformCityCategoryResponse(result);
  }

  async requestCityCategory(
    cityId: string,
    categoryId: string,
    requestedBy: string,
    notes?: string,
  ) {
    return this.prisma.categoryRequest.upsert({
      where: {
        cityId_categoryId_requestedBy_status: {
          cityId,
          categoryId,
          requestedBy,
          status: CategoryRequestStatus.PENDING,
        },
      },
      update: {
        notes,
      },
      create: {
        cityId,
        categoryId,
        requestedBy,
        notes,
      },
      include: {
        category: true,
      },
    });
  }

  async listCategoryRequests(options: { cityId?: string; status?: CategoryRequestStatus } = {}) {
    const { cityId, status } = options;

    return this.prisma.categoryRequest.findMany({
      where: {
        ...(cityId && { cityId }),
        ...(status && { status }),
      },
      include: {
        category: true,
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async handleCategoryRequest(
    requestId: string,
    status: CategoryRequestStatus,
    handledBy: string,
    notes?: string,
  ) {
    const request = await this.prisma.categoryRequest.update({
      where: { id: requestId },
      data: {
        status,
        handledBy,
        handledAt: new Date(),
        notes,
      },
      include: {
        category: true,
      },
    });

    if (status === CategoryRequestStatus.APPROVED) {
      await this.assignCategoryToCity(request.cityId, request.categoryId, handledBy);
    }

    return request;
  }

  async cityAdminHasAccess(userId: string, cityId: string) {
    const assignment = await this.prisma.userCityAssignment.findFirst({
      where: {
        userId,
        cityId,
        isActive: true,
      },
      select: { id: true },
    });

    return Boolean(assignment);
  }

  async updateCityCategoryDisplayName(
    cityId: string,
    categoryId: string,
    name: string | null,
    description?: string | null,
    subtitle?: string | null,
    displayOrder?: number,
    headerBackgroundColor?: string | null,
    contentBackgroundColor?: string | null,
    isActive?: boolean,
    visibility?: CategoryVisibility,
  ) {
    const existing = await this.prisma.cityCategory.findUnique({
      where: {
        cityId_categoryId: {
          cityId,
          categoryId,
        },
      },
      include: {
        category: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({ errorCode: 'CITY_CATEGORY_MAPPING_NOT_FOUND' });
    }

    const updateData: Prisma.CityCategoryUpdateInput = {
      displayName: name,
    };

    if (description !== undefined) {
      updateData.description = description;
    }

    if (subtitle !== undefined) {
      updateData.subtitle = subtitle;
    }

    if (displayOrder !== undefined) {
      updateData.displayOrder = displayOrder;
    }

    if (headerBackgroundColor !== undefined) {
      updateData.headerBackgroundColor = headerBackgroundColor;
    }

    if (contentBackgroundColor !== undefined) {
      updateData.contentBackgroundColor = contentBackgroundColor;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (visibility !== undefined) {
      updateData.visibility = visibility;
    }

    const result = await this.prisma.cityCategory.update({
      where: {
        cityId_categoryId: {
          cityId,
          categoryId,
        },
      },
      data: updateData,
      include: {
        category: true,
      },
    });
    await this.invalidateCategoryCache();
    return this.transformCityCategoryResponse(result);
  }

  /**
   * Get a single city category by cityId and categoryId
   * Falls back to base category values for any null city-specific fields
   * Uses categoryId as id field in response
   * Includes children categories if they are also assigned to the same city
   */
  async getCityCategoryById(cityId: string, categoryId: string, showAll: boolean = false) {
    const cityCategory = await this.prisma.cityCategory.findUnique({
      where: {
        cityId_categoryId: {
          cityId,
          categoryId,
        },
      },
      include: {
        category: true,
      },
    });

    if (!cityCategory) {
      throw new NotFoundException({ errorCode: 'CITY_CATEGORY_MAPPING_NOT_FOUND' });
    }

    const category = cityCategory.category;

    // Build base response with fallback to category defaults for null fields
    // Use categoryId as id, exclude original id and categoryId fields
    const { displayName, categoryId: catId, id: _originalId, ...rest } = cityCategory;
    const baseResponse = {
      id: catId,
      ...rest,
      name: displayName ?? category?.name ?? null,
      description: cityCategory.description ?? category?.description ?? null,
      subtitle: cityCategory.subtitle ?? category?.subtitle ?? null,
      imageUrl: cityCategory.imageUrl ?? category?.imageUrl ?? null,
      iconUrl: cityCategory.iconUrl ?? category?.iconUrl ?? null,
      headerBackgroundColor:
        cityCategory.headerBackgroundColor ?? category?.headerBackgroundColor ?? null,
      contentBackgroundColor:
        cityCategory.contentBackgroundColor ?? category?.contentBackgroundColor ?? null,
      viewType: category?.viewType ?? 'LISTINGS',
    };

    // Fetch children categories that are assigned to this city
    // Show all or only active based on showAll parameter
    const childrenCategories = await this.prisma.category.findMany({
      where: {
        parentId: categoryId,
        ...(showAll ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    if (childrenCategories.length === 0) {
      return baseResponse;
    }

    // Get CityCategory entries for all children to apply city-specific overrides
    const childrenCategoryIds = childrenCategories.map((c) => c.id);
    const childrenCityCategories = await this.prisma.cityCategory.findMany({
      where: {
        cityId,
        categoryId: { in: childrenCategoryIds },
        ...(showAll ? {} : { isActive: true }),
      },
      select: {
        categoryId: true,
        displayOrder: true,
        displayName: true,
        description: true,
        subtitle: true,
        imageUrl: true,
        iconUrl: true,
        headerBackgroundColor: true,
        contentBackgroundColor: true,
        isActive: true,
      },
    });

    // Create a map for quick lookup of city-specific overrides for children
    const childrenCityCategoryMap = new Map<string, (typeof childrenCityCategories)[number]>();
    childrenCityCategories.forEach((cc) => {
      childrenCityCategoryMap.set(cc.categoryId, cc);
    });

    // Only include children that are assigned to this city
    const assignedChildrenIds = new Set(childrenCityCategories.map((cc) => cc.categoryId));
    const assignedChildren = childrenCategories.filter((child) =>
      assignedChildrenIds.has(child.id),
    );

    // Merge CityCategory overrides with base Category data for children
    const childrenWithOverrides = assignedChildren.map((child) => {
      const cityOverrides = childrenCityCategoryMap.get(child.id);
      return {
        ...child,
        id: child.id,
        name: cityOverrides?.displayName || child.name,
        description: cityOverrides?.description ?? child.description,
        subtitle: cityOverrides?.subtitle ?? child.subtitle,
        imageUrl: cityOverrides?.imageUrl || child.imageUrl || baseResponse.imageUrl, // Inherit from parent if null
        iconUrl: cityOverrides?.iconUrl || child.iconUrl,
        headerBackgroundColor: cityOverrides?.headerBackgroundColor || child.headerBackgroundColor,
        contentBackgroundColor:
          cityOverrides?.contentBackgroundColor || child.contentBackgroundColor,
        cityCategoryDisplayOrder: cityOverrides?.displayOrder,
        // Use CityCategory's isActive status (city-specific active state)
        isActive: cityOverrides?.isActive ?? child.isActive,
        hasCityOverride: Boolean(cityOverrides?.displayName),
        cityId,
      };
    });

    // Sort children by displayOrder
    childrenWithOverrides.sort((a, b) => {
      const orderA = a.cityCategoryDisplayOrder ?? 0;
      const orderB = b.cityCategoryDisplayOrder ?? 0;
      return orderA - orderB;
    });

    // Translate the category tree (parent + children)
    const tree = await this.translateCategoryTree([
      {
        ...baseResponse,
        children: childrenWithOverrides,
      },
    ]);

    return tree[0];
  }
}
