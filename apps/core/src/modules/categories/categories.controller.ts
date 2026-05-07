import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AssignCategoryToCityDto,
  BadRequestErrorResponseDto,
  CategoryRequestFilterDto,
  CategoryRequestResponseDto,
  CategoryResponseDto,
  CityCategoryResponseDto,
  CategoryNotFoundErrorResponseDto,
  CategoryAssignmentNotFoundErrorResponseDto,
  CategoryRequestNotFoundErrorResponseDto,
  RequestCategoryDto,
  ResolveCategoryRequestDto,
  UnauthorizedErrorResponseDto,
  ValidationErrorResponseDto,
  ForbiddenErrorResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateCityCategoryDisplayNameDto,
  UploadCategoryImageResponseDto,
  UploadCategoryIconResponseDto,
  CategoryFilterDto,
  CategoryListResponseDto,
  CategoryQuickFilterResponseDto,
  CategoryQuickFilterQueryDto,
  CreateSubServiceDto,
  UpdateSubServiceDto,
  ReorderSubServicesDto,
  SubServiceItemDto,
} from '@kodi/contracts';
import { CurrentUser, GetCurrentUser, JwtAuthGuard, Public } from '@kodi/jwt';
import { CategoryRequestStatus, UserRole } from '@prisma/client-core';
import { CategoriesService, ViewerContext } from './categories.service';
import { SubServicesService } from './sub-services.service';
import { AdminOnlyGuard, SuperAdminOnly, CityAdminOnly, numberToRole } from '@kodi/rbac';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService, StorageService } from '@kodi/storage';
import { ConfigService } from '@kodi/config';
import { LoggerService } from '@kodi/logger';
import { PrismaCoreService } from '@kodi/prisma';
import { FiltersService } from '../filters/filters.service';
import { I18N_CONTEXT_KEY } from '@kodi/i18n';
import { Request } from 'express';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly filtersService: FiltersService,
    private readonly fileUploadService: FileUploadService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaCoreService,
    private readonly subServicesService: SubServicesService,
  ) {
    this.logger.setContext(CategoriesController.name);
  }

  private getRoles(role?: string | number): UserRole[] {
    if (!role) {
      return [];
    }

    // Handle number roles
    if (typeof role === 'number') {
      const roleEnum = numberToRole(role);
      return roleEnum ? [roleEnum] : [];
    }

    // Handle string roles (backward compatibility)
    const normalized = role.toUpperCase() as keyof typeof UserRole;
    const mapped = UserRole[normalized];

    return mapped ? [mapped] : [];
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

  private getViewerContext(user?: CurrentUser): ViewerContext {
    return {
      isAuthenticated: Boolean(user?.userId),
      isGuest: Boolean(user?.isGuest),
    };
  }

  private parseRequestStatus(
    value?: string | CategoryRequestStatus,
  ): CategoryRequestStatus | undefined {
    if (!value) {
      return undefined;
    }

    if (Object.values(CategoryRequestStatus).includes(value as CategoryRequestStatus)) {
      return value as CategoryRequestStatus;
    }

    const normalized = String(value).toUpperCase() as keyof typeof CategoryRequestStatus;
    if (!(normalized in CategoryRequestStatus)) {
      throw new BadRequestException({ errorCode: 'CATEGORY_REQUEST_INVALID_STATUS' });
    }
    return CategoryRequestStatus[normalized];
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List categories',
    description:
      'Retrieve categories with filtering, search, and pagination. Category names, descriptions, and subtitles are returned in the requested language when translations exist, otherwise they fall back to the default language.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). When set (or when selected via the Swagger language selector), category text fields are translated where translations exist.',
    example: 'de',
  })
  @ApiQuery({
    name: 'showAll',
    required: false,
    type: Boolean,
    description:
      'When true, returns both active and inactive categories/subcategories. When false or omitted, returns only active categories.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: CategoryListResponseDto,
  })
  async list(@Query() filter: CategoryFilterDto, @Query('showAll') showAll?: string) {
    const showAllBool = showAll === 'true';
    return this.categoriesService.listCategories(filter, showAllBool);
  }

  @Public()
  @Get('main')
  @ApiOperation({
    summary: 'Get all main categories',
    description:
      'Retrieve all main/root categories (categories without a parent). Returns a flat list of main categories without subcategories. Category names, descriptions, and subtitles are returned in the requested language when translations exist.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). When set, category text fields are translated where translations exist.',
    example: 'de',
  })
  @ApiResponse({
    status: 200,
    description: 'Main categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  async listMainCategories() {
    return this.categoriesService.listMainCategories();
  }

  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({
    summary: 'Create category',
    description:
      'Create a new category to organize listings. Slugs are automatically generated and deduplicated.',
  })
  @ApiBody({
    type: CreateCategoryDto,
    examples: {
      default: {
        summary: 'Create event category',
        value: {
          name: 'Community Events',
          type: 'EVENT',
          isActive: true,
        },
      },
      withCities: {
        summary: 'Create category and assign to cities',
        value: {
          name: 'Community Events',
          type: 'EVENT',
          isActive: true,
          cities: [{ cityId: '22a7b284-76aa-43a7-a3ec-797f0c045182' }],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request payload',
    type: ValidationErrorResponseDto,
    content: {
      'application/json': {
        example: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/categories',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 400,
          details: {
            message: [
              'name should not be empty',
              'type must be a valid CategoryType enum value',
              'isActive must be a boolean value',
            ],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @SuperAdminOnly()
  async create(@GetCurrentUser() user: CurrentUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto, user.userId);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update category',
    description:
      'Update an existing category. Changing the slug automatically handles deduplication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: UpdateCategoryDto,
    examples: {
      rename: {
        summary: 'Rename category',
        value: {
          name: 'Updated Category Name',
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update payload',
    type: ValidationErrorResponseDto,
    content: {
      'application/json': {
        example: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/categories/c1a2b3c4-d5e6-7890-abcd-ef1234567890',
          method: 'PATCH',
          requestId: 'req_1234567890_abc123',
          statusCode: 400,
          details: {
            message: ['name must be a string', 'isActive must be a boolean value'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: CategoryNotFoundErrorResponseDto,
  })
  @SuperAdminOnly()
  async update(
    @Param('id') id: string,
    @GetCurrentUser() user: CurrentUser,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete category',
    description:
      'Delete a category that is not associated with any listings. Returns the removed category.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Category cannot be deleted because it is in use',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: CategoryNotFoundErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @SuperAdminOnly()
  async delete(@Param('id') id: string, @GetCurrentUser() _user: CurrentUser) {
    return this.categoriesService.deleteCategory(id);
  }

  @Public()
  @Get('cities/:cityId')
  @ApiOperation({
    summary: 'List categories assigned to a city',
    description:
      'Retrieve active category assignments for a specific city with optional search and pagination. ' +
      'Category names, descriptions, and subtitles are returned in the requested language when translations exist, otherwise they fall back to the default language.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiResponse({
    status: 200,
    description: 'City categories retrieved successfully',
    type: CategoryListResponseDto,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). When set (or when selected via the Swagger language selector), assigned category text fields are translated where translations exist.',
    example: 'de',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'showAll',
    required: false,
    type: Boolean,
    description:
      'When true, returns both active and inactive categories/subcategories. When false or omitted, returns only active categories.',
  })
  async listCityCategories(
    @Param('cityId') cityId: string,
    @Query() filter: CategoryFilterDto,
    @Query('showAll') showAll?: string,
    @GetCurrentUser() user?: CurrentUser,
  ) {
    const showAllBool = showAll === 'true';
    const viewerContext = this.getViewerContext(user);
    return this.categoriesService.listCityCategories(cityId, filter, showAllBool, viewerContext);
  }

  @Public()
  @Get('cities/:cityId/with-filters')
  @ApiOperation({
    summary: 'List categories with quick filters for a city',
    description:
      'Retrieve active category assignments for a specific city with quick filters (e.g., "Nearby", "See all") embedded as virtual children in root categories. ' +
      'Quick filters are identified by the isQuickFilter=true flag and include quickFilter and radiusMeters fields. ' +
      'Category names, descriptions, subtitles, and quick filter labels are returned in the requested language when translations exist, otherwise they fall back to the default language.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiResponse({
    status: 200,
    description: 'City categories with quick filters retrieved successfully',
    type: [CategoryResponseDto],
    content: {
      'application/json': {
        example: {
          success: true,
          data: [
            {
              id: 'cat_01HZXTY0YK3H2V4C5B6N7P8Q',
              name: 'Shopping',
              slug: 'shopping',
              description: 'Discover local shops and markets',
              subtitle: 'Shop local',
              imageUrl: null,
              iconUrl: null,
              headerBackgroundColor: null,
              contentBackgroundColor: null,
              type: 'SHOPPING',
              parentId: null,
              isActive: true,
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z',
              children: [
                {
                  id: 'virtual_nearby_shopping',
                  name: 'Nearby',
                  slug: 'nearby',
                  description: null,
                  subtitle: null,
                  imageUrl: null,
                  iconUrl: null,
                  headerBackgroundColor: null,
                  contentBackgroundColor: null,
                  type: null,
                  parentId: 'cat_01HZXTY0YK3H2V4C5B6N7P8Q',
                  isActive: true,
                  createdAt: '2025-01-01T00:00:00.000Z',
                  updatedAt: '2025-01-01T00:00:00.000Z',
                  isQuickFilter: true,
                  quickFilter: 'nearby',
                  radiusMeters: 1500,
                  children: [],
                },
                {
                  id: 'virtual_see-all_shopping',
                  name: 'See all',
                  slug: 'see-all',
                  description: null,
                  subtitle: null,
                  imageUrl: null,
                  iconUrl: null,
                  headerBackgroundColor: null,
                  contentBackgroundColor: null,
                  type: null,
                  parentId: 'cat_01HZXTY0YK3H2V4C5B6N7P8Q',
                  isActive: true,
                  createdAt: '2025-01-01T00:00:00.000Z',
                  updatedAt: '2025-01-01T00:00:00.000Z',
                  isQuickFilter: true,
                  quickFilter: 'see-all',
                  radiusMeters: null,
                  children: [],
                },
                {
                  id: 'cat_01HZXTY0YK3H2V4C5B6N7P8R',
                  name: 'Fashion',
                  slug: 'fashion',
                  description: 'Clothing and accessories',
                  subtitle: null,
                  imageUrl: null,
                  iconUrl: null,
                  headerBackgroundColor: null,
                  contentBackgroundColor: null,
                  type: 'SHOPPING',
                  parentId: 'cat_01HZXTY0YK3H2V4C5B6N7P8Q',
                  isActive: true,
                  createdAt: '2025-01-01T00:00:00.000Z',
                  updatedAt: '2025-01-01T00:00:00.000Z',
                  isQuickFilter: false,
                  quickFilter: null,
                  radiusMeters: null,
                  children: [],
                },
              ],
            },
          ],
          message: 'City categories with quick filters retrieved successfully',
          timestamp: '2025-01-01T00:00:00.000Z',
          path: '/categories/cities/city_01HZXTY0YK3H2V4C5B6N7P8Q/with-filters',
          statusCode: 200,
        },
      },
    },
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). When set (or when selected via the Swagger language selector), assigned category text fields and quick filter labels are translated where translations exist.',
    example: 'de',
  })
  async listCityCategoriesWithFilters(
    @Param('cityId') cityId: string,
    @GetCurrentUser() user?: CurrentUser,
  ) {
    const viewerContext = this.getViewerContext(user);
    return this.categoriesService.listCityCategoriesWithFilters(
      cityId,
      user?.userId,
      viewerContext,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @Post('cities/:cityId/assign')
  @ApiOperation({
    summary: 'Assign category to city (super admin only)',
    description: 'Attach a category to a city, creating the assignment if necessary.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiBody({
    type: AssignCategoryToCityDto,
    examples: {
      default: {
        summary: 'Assign existing category',
        value: {
          categoryId: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category assigned to city',
    type: CityCategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or assignment not allowed',
    type: ValidationErrorResponseDto,
    content: {
      'application/json': {
        example: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/categories/cities/city_01HZXTY0YK3H2V4C5B6N7P8Q/assign',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 400,
          details: {
            message: ['categoryId must be a UUID', 'categoryId should not be empty'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @SuperAdminOnly()
  async assignCategory(
    @Param('cityId') cityId: string,
    @GetCurrentUser() user: CurrentUser,
    @Body() dto: AssignCategoryToCityDto,
  ) {
    return this.categoriesService.assignCategoryToCity(
      cityId,
      dto.categoryId,
      user.userId,
      dto.name,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('cities/:cityId/categories/:categoryId')
  @ApiOperation({
    summary: 'Remove category from city (super admin only)',
    description:
      'Soft-remove a category assignment from a city. Returns the updated assignment record.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category removed from city',
    type: CityCategoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City/category assignment not found',
    type: CategoryAssignmentNotFoundErrorResponseDto,
  })
  @SuperAdminOnly()
  async removeCategory(
    @Param('cityId') cityId: string,
    @Param('categoryId') categoryId: string,
    @GetCurrentUser() _user: CurrentUser,
  ) {
    return this.categoriesService.removeCategoryFromCity(cityId, categoryId);
  }

  @Public()
  @Get('cities/:cityId/categories/:categoryId')
  @ApiOperation({
    summary: 'Get a single city category by category ID',
    description:
      'Retrieve a specific category assignment for a city, including category details and city-specific overrides.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'City category retrieved successfully',
    type: CityCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City/category assignment not found',
    type: CategoryAssignmentNotFoundErrorResponseDto,
  })
  @ApiQuery({
    name: 'showAll',
    required: false,
    type: Boolean,
    description:
      'When true, returns both active and inactive subcategories. When false or omitted, returns only active subcategories.',
  })
  async getCityCategoryById(
    @Param('cityId') cityId: string,
    @Param('categoryId') categoryId: string,
    @Query('showAll') showAll?: string,
  ) {
    const showAllBool = showAll === 'true';
    return this.categoriesService.getCityCategoryById(cityId, categoryId, showAllBool);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch('cities/:cityId/categories/:categoryId')
  @ApiOperation({
    summary: 'Update city category settings',
    description:
      'Update the custom display name, description, subtitle, images, and colors for a category in a specific city. City admins can update for their cities, super admins can update for any city.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: UpdateCityCategoryDisplayNameDto,
    examples: {
      fullUpdate: {
        summary: 'Update all customizable fields',
        value: {
          name: 'Local Events',
          description: 'Discover and participate in local community events',
          subtitle: 'Connect with your community',
          displayOrder: 1,
          headerBackgroundColor: '#7C3AED',
          contentBackgroundColor: '#F3E8FF',
        },
      },
      setName: {
        summary: 'Set custom name only',
        value: {
          name: 'Local Events',
        },
      },
      setDescription: {
        summary: 'Set custom description and subtitle',
        value: {
          description: 'Discover and participate in local community events',
          subtitle: 'Connect with your community',
        },
      },
      setColors: {
        summary: 'Set custom colors',
        value: {
          headerBackgroundColor: '#7C3AED',
          contentBackgroundColor: '#F3E8FF',
        },
      },
      setDisplayOrder: {
        summary: 'Set display order',
        value: {
          displayOrder: 1,
        },
      },
      resetToDefault: {
        summary: 'Reset all fields to default (use category values)',
        value: {
          name: null,
          description: null,
          subtitle: null,
          headerBackgroundColor: null,
          contentBackgroundColor: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'City category settings updated successfully',
    type: CityCategoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'City Admin or Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City/category assignment not found',
    type: CategoryAssignmentNotFoundErrorResponseDto,
  })
  @CityAdminOnly()
  async updateDisplayName(
    @Param('cityId') cityId: string,
    @Param('categoryId') categoryId: string,
    @GetCurrentUser() user: CurrentUser,
    @Body() dto: UpdateCityCategoryDisplayNameDto,
  ) {
    const roles = this.getRoles(user?.role);
    if (!roles.includes(UserRole.SUPER_ADMIN)) {
      const hasAccess = await this.categoriesService.cityAdminHasAccess(user.userId, cityId);
      if (!hasAccess) {
        throw new BadRequestException({ errorCode: 'CITY_ACCESS_DENIED' });
      }
    }

    return this.categoriesService.updateCityCategoryDisplayName(
      cityId,
      categoryId,
      dto.name ?? null,
      dto.description,
      dto.subtitle,
      dto.displayOrder,
      dto.headerBackgroundColor,
      dto.contentBackgroundColor,
      dto.isActive,
      dto.visibility,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @Post('cities/:cityId/categories/:categoryId/image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'City category image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Upload city category image',
    description:
      'Upload and process a custom background image for a city category. City admins can upload for their cities, super admins can upload for any city.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'City category image uploaded successfully',
    type: CityCategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'City Admin or Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City/category assignment not found',
    type: CategoryAssignmentNotFoundErrorResponseDto,
  })
  @CityAdminOnly()
  async uploadCityCategoryImage(
    @Param('cityId') cityId: string,
    @Param('categoryId') categoryId: string,
    @UploadedFile() file: any,
    @GetCurrentUser() user: CurrentUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const roles = this.getRoles(user?.role);
    if (!roles.includes(UserRole.SUPER_ADMIN)) {
      const hasAccess = await this.categoriesService.cityAdminHasAccess(user.userId, cityId);
      if (!hasAccess) {
        throw new BadRequestException({ errorCode: 'CITY_ACCESS_DENIED' });
      }
    }

    const existing = await this.prisma.cityCategory.findUnique({
      where: { cityId_categoryId: { cityId, categoryId } },
      include: { category: true },
    });

    if (!existing) {
      throw new BadRequestException({ errorCode: 'CITY_CATEGORY_MAPPING_NOT_FOUND' });
    }

    await this.fileUploadService.validateImage(file);
    const processedFile = await this.fileUploadService.processImage(file);

    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete old image if exists
    if (existing.imageUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.imageUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(
          `Failed to delete old image for city category ${cityId}/${categoryId}`,
          error,
        );
      }
    }

    const key = this.fileUploadService.generateCityCategoryImageKey(
      cityId,
      categoryId,
      processedFile.extension,
    );
    const imageUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    return this.prisma.cityCategory.update({
      where: { cityId_categoryId: { cityId, categoryId } },
      data: { imageUrl },
      include: { category: true },
    });
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('cities/:cityId/categories/:categoryId/image')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete city category image',
    description:
      'Remove the custom background image from a city category. City admins can delete for their cities, super admins can delete for any city.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 204,
    description: 'City category image deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'City Admin or Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City/category assignment not found',
    type: CategoryAssignmentNotFoundErrorResponseDto,
  })
  @CityAdminOnly()
  async deleteCityCategoryImage(
    @Param('cityId') cityId: string,
    @Param('categoryId') categoryId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    const roles = this.getRoles(user?.role);
    if (!roles.includes(UserRole.SUPER_ADMIN)) {
      const hasAccess = await this.categoriesService.cityAdminHasAccess(user.userId, cityId);
      if (!hasAccess) {
        throw new BadRequestException({ errorCode: 'CITY_ACCESS_DENIED' });
      }
    }

    const existing = await this.prisma.cityCategory.findUnique({
      where: { cityId_categoryId: { cityId, categoryId } },
    });

    if (!existing) {
      throw new BadRequestException({ errorCode: 'CITY_CATEGORY_MAPPING_NOT_FOUND' });
    }

    if (existing.imageUrl) {
      try {
        const key = this.extractKeyFromUrl(existing.imageUrl);
        const bucket = this.configService.storageConfig.defaultBucket;
        if (bucket) {
          await this.storageService.deleteFile({ bucket, key });
        }
      } catch (error) {
        this.logger.warn(`Failed to delete image for city category ${cityId}/${categoryId}`, error);
      }

      await this.prisma.cityCategory.update({
        where: { cityId_categoryId: { cityId, categoryId } },
        data: { imageUrl: null },
      });
    }
  }

  @ApiBearerAuth('JWT-auth')
  @Post('cities/:cityId/categories/:categoryId/icon')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'City category icon file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Upload city category icon',
    description:
      'Upload and process a custom icon for a city category. City admins can upload for their cities, super admins can upload for any city.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'City category icon uploaded successfully',
    type: CityCategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'City Admin or Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City/category assignment not found',
    type: CategoryAssignmentNotFoundErrorResponseDto,
  })
  @CityAdminOnly()
  async uploadCityCategoryIcon(
    @Param('cityId') cityId: string,
    @Param('categoryId') categoryId: string,
    @UploadedFile() file: any,
    @GetCurrentUser() user: CurrentUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const roles = this.getRoles(user?.role);
    if (!roles.includes(UserRole.SUPER_ADMIN)) {
      const hasAccess = await this.categoriesService.cityAdminHasAccess(user.userId, cityId);
      if (!hasAccess) {
        throw new BadRequestException({ errorCode: 'CITY_ACCESS_DENIED' });
      }
    }

    const existing = await this.prisma.cityCategory.findUnique({
      where: { cityId_categoryId: { cityId, categoryId } },
      include: { category: true },
    });

    if (!existing) {
      throw new BadRequestException({ errorCode: 'CITY_CATEGORY_MAPPING_NOT_FOUND' });
    }

    await this.fileUploadService.validateImage(file);
    const processedFile = await this.fileUploadService.processImage(file);

    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete old icon if exists
    if (existing.iconUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.iconUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(
          `Failed to delete old icon for city category ${cityId}/${categoryId}`,
          error,
        );
      }
    }

    const key = this.fileUploadService.generateCityCategoryIconKey(
      cityId,
      categoryId,
      processedFile.extension,
    );
    const iconUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    return this.prisma.cityCategory.update({
      where: { cityId_categoryId: { cityId, categoryId } },
      data: { iconUrl },
      include: { category: true },
    });
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('cities/:cityId/categories/:categoryId/icon')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete city category icon',
    description:
      'Remove the custom icon from a city category. City admins can delete for their cities, super admins can delete for any city.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 204,
    description: 'City category icon deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'City Admin or Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City/category assignment not found',
    type: CategoryAssignmentNotFoundErrorResponseDto,
  })
  @CityAdminOnly()
  async deleteCityCategoryIcon(
    @Param('cityId') cityId: string,
    @Param('categoryId') categoryId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    const roles = this.getRoles(user?.role);
    if (!roles.includes(UserRole.SUPER_ADMIN)) {
      const hasAccess = await this.categoriesService.cityAdminHasAccess(user.userId, cityId);
      if (!hasAccess) {
        throw new BadRequestException({ errorCode: 'CITY_ACCESS_DENIED' });
      }
    }

    const existing = await this.prisma.cityCategory.findUnique({
      where: { cityId_categoryId: { cityId, categoryId } },
    });

    if (!existing) {
      throw new BadRequestException({ errorCode: 'CITY_CATEGORY_MAPPING_NOT_FOUND' });
    }

    if (existing.iconUrl) {
      try {
        const key = this.extractKeyFromUrl(existing.iconUrl);
        const bucket = this.configService.storageConfig.defaultBucket;
        if (bucket) {
          await this.storageService.deleteFile({ bucket, key });
        }
      } catch (error) {
        this.logger.warn(`Failed to delete icon for city category ${cityId}/${categoryId}`, error);
      }

      await this.prisma.cityCategory.update({
        where: { cityId_categoryId: { cityId, categoryId } },
        data: { iconUrl: null },
      });
    }
  }

  @ApiBearerAuth('JWT-auth')
  @Post('cities/:cityId/requests')
  @ApiOperation({
    summary: 'City admin requests a category for their city',
    description:
      'Create or update a pending category request for a city. If a pending request already exists, the notes will be updated instead.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiBody({
    type: RequestCategoryDto,
    examples: {
      request: {
        summary: 'Request category',
        value: {
          categoryId: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
          notes: 'We plan to launch a new volunteer program in this category.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category request created',
    type: CategoryRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or city admin lacks access',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'City Admin or Super Admin role required',
    type: ForbiddenErrorResponseDto,
  })
  @CityAdminOnly()
  async requestCategory(
    @Param('cityId') cityId: string,
    @GetCurrentUser() user: CurrentUser,
    @Body() dto: RequestCategoryDto,
  ) {
    const roles = this.getRoles(user?.role);
    if (!roles.includes(UserRole.SUPER_ADMIN)) {
      const hasAccess = await this.categoriesService.cityAdminHasAccess(user.userId, cityId);
      if (!hasAccess) {
        throw new BadRequestException({ errorCode: 'CITY_ACCESS_DENIED' });
      }
    }

    return this.categoriesService.requestCityCategory(
      cityId,
      dto.categoryId,
      user.userId,
      dto.notes,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @Get('requests')
  @ApiOperation({
    summary: 'List category requests',
    description:
      'Retrieve category requests across all cities. Supports filtering by city and status.',
  })
  @ApiQuery({
    name: 'cityId',
    required: false,
    description: 'Filter requests for a given city',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter requests by status',
    example: 'PENDING',
    enum: CategoryRequestStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Category requests retrieved successfully',
    type: CategoryRequestResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid filter parameters',
    type: ValidationErrorResponseDto,
    content: {
      'application/json': {
        example: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/categories/requests',
          method: 'GET',
          requestId: 'req_1234567890_abc123',
          statusCode: 400,
          details: {
            message: [
              'status must be a valid CategoryRequestStatus enum value',
              'cityId must be a string',
            ],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @SuperAdminOnly()
  async listRequests(
    @GetCurrentUser() user: CurrentUser,
    @Query() query: CategoryRequestFilterDto,
  ) {
    const parsedStatus = this.parseRequestStatus(query.status);
    return this.categoriesService.listCategoryRequests({
      cityId: query.cityId,
      status: parsedStatus,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @Get('cities/:cityId/requests')
  @ApiOperation({
    summary: 'List category requests for a city',
    description:
      'Retrieve category requests submitted for a specific city. City admins can only access cities they manage.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter requests by status',
    example: 'PENDING',
    enum: CategoryRequestStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Category requests for city retrieved',
    type: CategoryRequestResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid filter parameters or lack of access',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'City Admin or Super Admin role required',
    type: ForbiddenErrorResponseDto,
  })
  @CityAdminOnly()
  async listCityRequests(
    @Param('cityId') cityId: string,
    @GetCurrentUser() user: CurrentUser,
    @Query() query: CategoryRequestFilterDto,
  ) {
    const roles = this.getRoles(user?.role);
    if (!roles.includes(UserRole.SUPER_ADMIN)) {
      const hasAccess = await this.categoriesService.cityAdminHasAccess(user.userId, cityId);
      if (!hasAccess) {
        throw new BadRequestException({ errorCode: 'CITY_ACCESS_DENIED' });
      }
    }

    const parsedStatus = this.parseRequestStatus(query.status);
    return this.categoriesService.listCategoryRequests({ cityId, status: parsedStatus });
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Category image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Upload category image',
    description: 'Upload and process an image for a category. Only Super Admin can upload images.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category image uploaded successfully',
    type: UploadCategoryImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: CategoryNotFoundErrorResponseDto,
  })
  @SuperAdminOnly()
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @GetCurrentUser() _user: CurrentUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const existing = await this.categoriesService.getCategoryById(id);

    await this.fileUploadService.validateImage(file);
    const processedFile = await this.fileUploadService.processImage(file);

    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    if (existing.imageUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.imageUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(`Failed to delete old image for category ${id}`, error);
      }
    }

    const key = this.fileUploadService.generateCategoryImageKey(id, processedFile.extension);
    const imageUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    await this.prisma.category.update({
      where: { id },
      data: { imageUrl },
    });

    const category = await this.categoriesService.getCategoryById(id);
    return { category, imageUrl };
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/icon')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Category icon file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Upload category icon',
    description: 'Upload and process an icon for a category. Only Super Admin can upload icons.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category icon uploaded successfully',
    type: UploadCategoryIconResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: CategoryNotFoundErrorResponseDto,
  })
  @SuperAdminOnly()
  async uploadIcon(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @GetCurrentUser() _user: CurrentUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const existing = await this.categoriesService.getCategoryById(id);

    await this.fileUploadService.validateImage(file);
    const processedFile = await this.fileUploadService.processImage(file);

    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    if (existing.iconUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.iconUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(`Failed to delete old icon for category ${id}`, error);
      }
    }

    const key = this.fileUploadService.generateCategoryIconKey(id, processedFile.extension);
    const iconUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    await this.prisma.category.update({
      where: { id },
      data: { iconUrl },
    });

    const category = await this.categoriesService.getCategoryById(id);
    return { category, iconUrl };
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id/image')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete category image',
    description: 'Remove the image from a category. Only Super Admin can delete images.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 204,
    description: 'Category image deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: CategoryNotFoundErrorResponseDto,
  })
  @SuperAdminOnly()
  async deleteImage(@Param('id') id: string, @GetCurrentUser() _user: CurrentUser) {
    const category = await this.categoriesService.getCategoryById(id);

    if (category.imageUrl) {
      try {
        const key = this.extractKeyFromUrl(category.imageUrl);
        const bucket = this.configService.storageConfig.defaultBucket;
        if (bucket) {
          await this.storageService.deleteFile({ bucket, key });
        }
      } catch (error) {
        this.logger.warn(`Failed to delete image for category ${id}`, error);
      }

      await this.prisma.category.update({
        where: { id },
        data: { imageUrl: null },
      });
    }
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id/icon')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete category icon',
    description: 'Remove the icon from a category. Only Super Admin can delete icons.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 204,
    description: 'Category icon deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: CategoryNotFoundErrorResponseDto,
  })
  @SuperAdminOnly()
  async deleteIcon(@Param('id') id: string, @GetCurrentUser() _user: CurrentUser) {
    const category = await this.categoriesService.getCategoryById(id);

    if (category.iconUrl) {
      try {
        const key = this.extractKeyFromUrl(category.iconUrl);
        const bucket = this.configService.storageConfig.defaultBucket;
        if (bucket) {
          await this.storageService.deleteFile({ bucket, key });
        }
      } catch (error) {
        this.logger.warn(`Failed to delete icon for category ${id}`, error);
      }

      await this.prisma.category.update({
        where: { id },
        data: { iconUrl: null },
      });
    }
  }

  @Public()
  @Get(':categoryId/quick-filters')
  @ApiOperation({
    summary: 'Get quick filters for a category',
    description:
      'Retrieve available quick filter values for a specific category, grouped by heading. ' +
      'For categories like show-me-more, filters are additionally grouped by a top-level group name. ' +
      'Filter labels are translated based on locale query param or Accept-Language header when translations exist.',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    description:
      'Locale for translated labels (e.g., "en", "de"). When omitted, Accept-Language header is used.',
    example: 'en',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). Used when locale query param is not provided.',
    example: 'de',
  })
  @ApiResponse({
    status: 200,
    description: 'Quick filters retrieved successfully',
    type: CategoryQuickFilterResponseDto,
  })
  async getCategoryQuickFilters(
    @Param('categoryId') categoryId: string,
    @Query() query: CategoryQuickFilterQueryDto,
    @Req() request: Request,
  ) {
    const i18nContext = (request as any)[I18N_CONTEXT_KEY];
    const locale = query.locale ?? i18nContext?.language;
    return this.filtersService.getCategoryQuickFilters(categoryId, locale);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description:
      'Retrieve a specific category by its unique identifier, including its subcategories. Category text fields are returned in the requested language when translations exist, otherwise they fall back to the default language.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). When set (or when selected via the Swagger language selector), category and subcategory text fields are translated where translations exist.',
    example: 'de',
  })
  @ApiQuery({
    name: 'showAll',
    required: false,
    type: Boolean,
    description:
      'When true, returns both active and inactive subcategories. When false or omitted, returns only active subcategories.',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: CategoryNotFoundErrorResponseDto,
  })
  async getById(@Param('id') id: string, @Query('showAll') showAll?: string) {
    const showAllBool = showAll === 'true';
    return this.categoriesService.getCategoryById(id, showAllBool);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('requests/:requestId/resolve')
  @ApiOperation({
    summary: 'Resolve a category request (super admin only)',
    description: 'Approve or reject a pending category request, adding optional reviewer notes.',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Category request identifier',
    example: 'cr1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: ResolveCategoryRequestDto,
    examples: {
      approve: {
        summary: 'Approve request',
        value: {
          status: 'APPROVED',
          notes: 'Approved - aligns with the city program.',
        },
      },
      reject: {
        summary: 'Reject request',
        value: {
          status: 'REJECTED',
          notes: 'Rejected due to duplication.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category request resolved',
    type: CategoryRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload',
    type: ValidationErrorResponseDto,
    content: {
      'application/json': {
        example: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/categories/requests/cr1a2b3c4-d5e6-7890-abcd-ef1234567890/resolve',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 400,
          details: {
            message: [
              'status must be a valid CategoryRequestStatus enum value',
              'notes must be a string',
            ],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Super Admin access required',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category request not found',
    type: CategoryRequestNotFoundErrorResponseDto,
  })
  @SuperAdminOnly()
  async resolveRequest(
    @Param('requestId') requestId: string,
    @GetCurrentUser() user: CurrentUser,
    @Body() dto: ResolveCategoryRequestDto,
  ) {
    return this.categoriesService.handleCategoryRequest(
      requestId,
      dto.status,
      user.userId,
      dto.notes,
    );
  }

  // ==================== Sub-Service Management ====================

  @CityAdminOnly()
  @Post(':id/sub-services')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Add a sub-service item to a category',
    description:
      'Assign a Tile or Category as a sub-service item under a category with viewType SUB_SERVICES. Accessible by Super Admin and City Admin. If this assignment already exists, returns the existing sub-service without error (idempotent).',
  })
  @ApiParam({ name: 'id', description: 'Parent category ID' })
  @ApiResponse({ status: 201, description: 'Sub-service created', type: SubServiceItemDto })
  @ApiResponse({
    status: 400,
    description: 'Category viewType is not SUB_SERVICES or invalid item',
  })
  @ApiResponse({ status: 404, description: 'Category or referenced item not found' })
  @ApiBody({ type: CreateSubServiceDto })
  async createSubService(@Param('id') categoryId: string, @Body() dto: CreateSubServiceDto) {
    return this.subServicesService.createSubService(categoryId, dto);
  }

  @CityAdminOnly()
  @Patch(':id/sub-services/:subServiceId')
  @ApiOperation({
    summary: 'Update a sub-service item',
    description:
      'Update displayOrder or isActive of a sub-service assignment. Accessible by Super Admin and City Admin.',
  })
  @ApiParam({ name: 'id', description: 'Parent category ID' })
  @ApiParam({ name: 'subServiceId', description: 'Sub-service record ID' })
  @ApiResponse({ status: 200, description: 'Sub-service updated', type: SubServiceItemDto })
  @ApiResponse({ status: 404, description: 'Sub-service not found' })
  @ApiBody({ type: UpdateSubServiceDto })
  async updateSubService(
    @Param('id') categoryId: string,
    @Param('subServiceId') subServiceId: string,
    @Body() dto: UpdateSubServiceDto,
  ) {
    return this.subServicesService.updateSubService(categoryId, subServiceId, dto);
  }

  @CityAdminOnly()
  @Delete(':id/sub-services/tiles/:tileId')
  @ApiOperation({
    summary: 'Remove a tile sub-service from a category',
    description:
      'Delete the sub-service assignment for the given tile under this category (identified by tile ID). The tile itself is not deleted. Accessible by Super Admin and City Admin. If the assignment is already absent, returns the same success message (idempotent).',
  })
  @ApiParam({ name: 'id', description: 'Parent category ID' })
  @ApiParam({
    name: 'tileId',
    description: 'Tile ID (same as itemId used when adding a TILE sub-service)',
  })
  @ApiResponse({ status: 200, description: 'Sub-service removed (or was already not linked)' })
  async deleteTileSubService(@Param('id') categoryId: string, @Param('tileId') tileId: string) {
    return this.subServicesService.deleteTileSubService(categoryId, tileId);
  }

  @CityAdminOnly()
  @Put(':id/sub-services/reorder')
  @ApiOperation({
    summary: 'Reorder sub-service items',
    description:
      'Bulk update displayOrder for sub-service items. Accessible by Super Admin and City Admin.',
  })
  @ApiParam({ name: 'id', description: 'Parent category ID' })
  @ApiResponse({ status: 200, description: 'Sub-services reordered', type: [SubServiceItemDto] })
  @ApiBody({ type: ReorderSubServicesDto })
  async reorderSubServices(@Param('id') categoryId: string, @Body() dto: ReorderSubServicesDto) {
    return this.subServicesService.reorderSubServices(categoryId, dto.items);
  }
}
