import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateTileDto,
  TileFilterDto,
  UpdateTileDto,
  ValidationErrorResponseDto,
  UnauthorizedErrorResponseDto,
  UploadBackgroundImageResponseDto,
  UploadBackgroundImageResponseDataDto,
  UploadIconImageResponseDto,
  CreateTileResponseDto,
  UpdateTileResponseDto,
  GetTileResponseDto,
  ListTilesResponseDto,
  DeleteTileResponseDto,
  TileNotFoundErrorResponseDto,
  TileForbiddenErrorResponseDto,
} from '@kodi/contracts';
import { CurrentUser, GetCurrentUser, JwtAuthGuard, Public } from '@kodi/jwt';
import { UserRole } from '@prisma/client-core';
import { TilesService } from './tiles.service';
import {
  CityAdminOnly,
  AdminOnlyGuard,
  PermissionsGuard,
  RequiresPermission,
  numberToRole,
} from '@kodi/rbac';
import { FileUploadService, StorageService } from '@kodi/storage';
import { ConfigService } from '@kodi/config';
import { LoggerService } from '@kodi/logger';
import { PrismaCoreService } from '@kodi/prisma';

@ApiTags('tiles')
@Controller('tiles')
@UseGuards(JwtAuthGuard)
export class TilesController {
  constructor(
    private readonly tilesService: TilesService,
    private readonly fileUploadService: FileUploadService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaCoreService,
  ) {
    this.logger.setContext(TilesController.name);
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

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List tiles with filters',
    description:
      'Retrieve tiles using flexible filters including search term, city, active status, and date ranges. Supports pagination and sorting. Search filters by header, subheader, or description. ' +
      'When a non-default language is requested, tile text fields (header, subheader, description) are returned in that language when translations exist.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). When set (or when selected via the Swagger language selector), tile text fields are translated where translations exist.',
    example: 'de',
  })
  @ApiResponse({
    status: 200,
    description: 'Tiles retrieved successfully',
    type: ListTilesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed for one or more filter parameters',
    type: ValidationErrorResponseDto,
  })
  async list(@Query() filter: TileFilterDto) {
    return this.tilesService.listTiles(filter);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get tile by slug',
    description:
      'Fetch a single tile using its unique slug identifier. When a non-default language is requested, tile text fields (header, subheader, description) are returned in that language when translations exist.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). When set (or when selected via the Swagger language selector), tile text fields are translated where translations exist.',
    example: 'de',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slugified unique identifier for the tile',
    example: 'kodi-gift-card-promo',
  })
  @ApiResponse({
    status: 200,
    description: 'Tile retrieved successfully',
    type: GetTileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tile not found',
    type: TileNotFoundErrorResponseDto,
  })
  async getBySlug(@Param('slug') slug: string) {
    return this.tilesService.getTileBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get tile by ID',
    description:
      'Fetch a single tile using its unique identifier. When a non-default language is requested, tile text fields (header, subheader, description) are returned in that language when translations exist.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en, dk). When set (or when selected via the Swagger language selector), tile text fields are translated where translations exist.',
    example: 'de',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the tile',
    example: 'tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @ApiResponse({
    status: 200,
    description: 'Tile retrieved successfully',
    type: GetTileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tile not found',
    type: TileNotFoundErrorResponseDto,
  })
  async getById(@Param('id') id: string) {
    return this.tilesService.getTileById(id);
  }

  @Post()
  @UseGuards(AdminOnlyGuard, PermissionsGuard)
  @CityAdminOnly()
  @RequiresPermission('tiles', 'create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new tile',
    description: 'Create a new ad tile. Only Super Admin and City Admin can create tiles.',
  })
  @ApiBody({ type: CreateTileDto })
  @ApiResponse({
    status: 201,
    description: 'Tile created successfully',
    type: CreateTileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
    type: TileForbiddenErrorResponseDto,
  })
  async create(@Body() dto: CreateTileDto, @GetCurrentUser() user: CurrentUser) {
    const userId = user.userId;
    const roles = this.getRoles(user.role);
    return this.tilesService.createTile(userId, roles, dto);
  }

  @Patch(':id')
  @UseGuards(AdminOnlyGuard, PermissionsGuard)
  @CityAdminOnly()
  @RequiresPermission('tiles', 'update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a tile',
    description: 'Update an existing tile. Only Super Admin and City Admin can update tiles.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the tile',
    example: 'tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @ApiBody({ type: UpdateTileDto })
  @ApiResponse({
    status: 200,
    description: 'Tile updated successfully',
    type: UpdateTileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
    type: TileForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tile not found',
    type: TileNotFoundErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTileDto,
    @GetCurrentUser() user: CurrentUser,
  ) {
    const userId = user.userId;
    const roles = this.getRoles(user.role);
    return this.tilesService.updateTile(id, userId, roles, dto);
  }

  @Delete(':id')
  @UseGuards(AdminOnlyGuard, PermissionsGuard)
  @CityAdminOnly()
  @RequiresPermission('tiles', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a tile',
    description: 'Delete an existing tile. Only Super Admin and City Admin can delete tiles.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the tile',
    example: 'tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @ApiResponse({
    status: 200,
    description: 'Tile deleted successfully',
    type: DeleteTileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
    type: TileForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tile not found',
    type: TileNotFoundErrorResponseDto,
  })
  async delete(@Param('id') id: string, @GetCurrentUser() user: CurrentUser) {
    const userId = user.userId;
    const roles = this.getRoles(user.role);
    return this.tilesService.deleteTile(id, userId, roles);
  }

  @Post(':id/background-image')
  @UseGuards(AdminOnlyGuard, PermissionsGuard)
  @CityAdminOnly()
  @RequiresPermission('tiles', 'update')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Background image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Upload background image for a tile',
    description:
      'Upload and process a background image for a tile. Only Super Admin and City Admin can upload images.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the tile',
    example: 'tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @ApiResponse({
    status: 200,
    description: 'Background image uploaded successfully',
    type: UploadBackgroundImageResponseDto,
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
    description: 'Insufficient permissions',
    type: TileForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tile not found',
    type: TileNotFoundErrorResponseDto,
  })
  async uploadBackgroundImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @GetCurrentUser() _user: CurrentUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Get existing tile to check for old background image
    const existing = await this.tilesService.getTileById(id);

    // Validate image
    await this.fileUploadService.validateImage(file);

    // Process image
    const processedFile = await this.fileUploadService.processImage(file);

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete old background image if exists
    if (existing.backgroundImageUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.backgroundImageUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(`Failed to delete old background image for tile ${id}`, error);
        // Continue with upload even if old file deletion fails
      }
    }

    // Generate storage key
    const key = this.fileUploadService.generateTileBackgroundKey(id, processedFile.extension);

    // Upload to storage
    const imageUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    // Update tile backgroundImageUrl directly in database (bypassing DTO since backgroundImageUrl is not in UpdateTileDto)
    await this.prisma.tile.update({
      where: { id },
      data: { backgroundImageUrl: imageUrl },
    });

    // Refresh tile with relations
    const tile = await this.tilesService.getTileById(id);

    // Return data - interceptor will wrap it
    return {
      tile,
      imageUrl,
    } as UploadBackgroundImageResponseDataDto;
  }

  @Post(':id/icon-image')
  @UseGuards(AdminOnlyGuard, PermissionsGuard)
  @CityAdminOnly()
  @RequiresPermission('tiles', 'update')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Icon image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Upload icon image for a tile',
    description:
      'Upload and process an icon image for a tile. Only Super Admin and City Admin can upload images.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the tile',
    example: 'tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @ApiResponse({
    status: 200,
    description: 'Icon image uploaded successfully',
    type: UploadIconImageResponseDto,
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
    description: 'Insufficient permissions',
    type: TileForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tile not found',
    type: TileNotFoundErrorResponseDto,
  })
  async uploadIconImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @GetCurrentUser() _user: CurrentUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Get existing tile to check for old icon image
    const existing = await this.tilesService.getTileById(id);

    // Validate image
    await this.fileUploadService.validateImage(file);

    // Process image
    const processedFile = await this.fileUploadService.processImage(file);

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete old icon image if exists
    if (existing.iconImageUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.iconImageUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(`Failed to delete old icon image for tile ${id}`, error);
        // Continue with upload even if old file deletion fails
      }
    }

    // Generate storage key
    const key = this.fileUploadService.generateTileIconKey(id, processedFile.extension);

    // Upload to storage
    const imageUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    // Update tile iconImageUrl directly in database
    await this.prisma.tile.update({
      where: { id },
      data: { iconImageUrl: imageUrl },
    });

    // Refresh tile with relations
    const tile = await this.tilesService.getTileById(id);

    // Return data - interceptor will wrap it
    return {
      tile,
      imageUrl,
    };
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
}
