import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CityService } from './city.service';
import { FileUploadService, StorageService } from '@kodi/storage';
import { ConfigService } from '@kodi/config';
import { LoggerService } from '@kodi/logger';
import { PrismaCityService } from '@kodi/prisma';
import {
  CreateCityDto,
  UpdateCityDto,
  ListCitiesResponseDto,
  GetCityResponseDto,
  CreateCityResponseDto,
  UpdateCityResponseDto,
  DeleteCityResponseDto,
  CityNotFoundErrorResponseDto,
  ValidationErrorResponseDto,
  CityFilterDto,
} from '@kodi/contracts';

@ApiTags('city')
@Controller()
export class CityController {
  constructor(
    private readonly cityService: CityService,
    private readonly fileUploadService: FileUploadService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaCityService,
  ) {
    this.logger.setContext(CityController.name);
  }

  @Get()
  @ApiOperation({
    summary: 'List all cities',
    description:
      'Retrieve a list of cities with optional filtering and sorting. Supports filtering by country, key, and isActive status.',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter cities by country name or code',
    example: 'Germany',
  })
  @ApiQuery({
    name: 'key',
    required: false,
    description: 'Filter cities by unique key',
    example: 'kodi',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    example: true,
    type: Boolean,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    enum: ['name', 'country', 'createdAt', 'updatedAt'],
    example: 'name',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @ApiResponse({
    status: 200,
    description: 'Cities retrieved successfully',
    type: ListCitiesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed for query parameters',
    type: ValidationErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() filterDto: CityFilterDto) {
    return this.cityService.findAll(filterDto);
  }

  @Get('search/nearby')
  @ApiOperation({
    summary: 'Find nearby cities',
    description:
      'Find cities within a specified radius (in kilometers) from given coordinates using the Haversine formula.',
  })
  @ApiQuery({
    name: 'lat',
    required: true,
    description: 'Latitude coordinate (decimal degrees)',
    example: 54.3233,
    type: Number,
  })
  @ApiQuery({
    name: 'lng',
    required: true,
    description: 'Longitude coordinate (decimal degrees)',
    example: 10.1394,
    type: Number,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in kilometers',
    example: 50,
    type: Number,
    default: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby cities retrieved successfully',
    type: ListCitiesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed for query parameters',
    type: ValidationErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 50,
  ) {
    return this.cityService.findNearby(+lat, +lng, +radius);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get city by ID',
    description: 'Retrieve a single city by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'City retrieved successfully',
    type: GetCityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: CityNotFoundErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.cityService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new city',
    description:
      'Create a new city with the provided information. All required fields must be provided.',
  })
  @ApiBody({
    type: CreateCityDto,
    examples: {
      basicCity: {
        summary: 'Basic city creation',
        value: {
          name: 'Kodi',
          country: 'Germany',
          latitude: 54.3233,
          longitude: 10.1394,
        },
      },
      fullCity: {
        summary: 'City with all fields',
        value: {
          name: 'Kodi',
          country: 'Germany',
          state: 'Schleswig-Holstein',
          latitude: 54.3233,
          longitude: 10.1394,
          population: 247548,
          timezone: 'Europe/Berlin',
          metadata: {
            areaCode: '0431',
            postalCode: '24103',
          },
        },
        description: 'Example with all optional fields included',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'City created successfully',
    type: CreateCityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: ValidationErrorResponseDto,
    examples: {
      missingRequired: {
        summary: 'Missing required fields',
        value: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 400,
          details: {
            message: ['name should not be empty', 'latitude must be a number'],
          },
        },
      },
      invalidCoordinates: {
        summary: 'Invalid coordinates',
        value: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 400,
          details: {
            message: [
              'latitude must not be greater than 90',
              'longitude must not be greater than 180',
            ],
          },
        },
      },
    },
  })
  async create(@Body() dto: CreateCityDto) {
    return this.cityService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a city',
    description:
      'Update an existing city. Only provided fields will be updated. Setting isActive to false performs a soft delete.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateCityDto,
    examples: {
      updateName: {
        summary: 'Update city name',
        value: {
          name: 'Kodi Updated',
        },
      },
      updatePopulation: {
        summary: 'Update population',
        value: {
          population: 250000,
        },
      },
      softDelete: {
        summary: 'Soft delete city',
        value: {
          isActive: false,
        },
        description: 'Setting isActive to false performs a soft delete',
      },
      fullUpdate: {
        summary: 'Update multiple fields',
        value: {
          name: 'Kodi',
          population: 247548,
          timezone: 'Europe/Berlin',
          metadata: {
            areaCode: '0431',
            postalCode: '24103',
          },
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'City updated successfully',
    type: UpdateCityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: CityNotFoundErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.cityService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a city',
    description:
      'Delete a city by setting isActive to false (soft delete). The city record remains in the database but is marked as inactive.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'City deleted successfully',
    type: DeleteCityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: CityNotFoundErrorResponseDto,
    examples: {
      notFound: {
        summary: 'City not found',
        value: {
          errorCode: 'CITY_NOT_FOUND',
          message: 'City not found',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/123e4567-e89b-12d3-a456-426614174000',
          method: 'DELETE',
          requestId: 'req_1234567890_abc123',
          statusCode: 404,
          details: {
            cityId: '123e4567-e89b-12d3-a456-426614174000',
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.cityService.delete(id);
  }

  @Post(':id/header-image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload header image for a city',
    description: 'Upload and process a header image for a city.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Header image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Header image uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: CityNotFoundErrorResponseDto,
  })
  async uploadHeaderImage(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Get existing city to check for old header image
    const existing = await this.cityService.findOne(id);

    // Validate image
    await this.fileUploadService.validateImage(file);

    // Process image
    const processedFile = await this.fileUploadService.processImage(file);

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete old header image if exists
    if (existing.headerImageUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.headerImageUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(`Failed to delete old header image for city ${id}`, error);
        // Continue with upload even if old file deletion fails
      }
    }

    // Generate storage key
    const key = this.fileUploadService.generateCityHeaderKey(id, processedFile.extension);

    // Upload to storage
    const imageUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    // Update city headerImageUrl directly in database
    await this.prisma.city.update({
      where: { id },
      data: { headerImageUrl: imageUrl },
    });

    // Refresh city
    const city = await this.cityService.findOne(id);

    return {
      city,
      imageUrl,
    };
  }

  @Delete(':id/header-image')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete header image for a city',
    description: 'Delete the header image for a city from storage and database.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Header image deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found or header image not found',
    type: CityNotFoundErrorResponseDto,
  })
  async deleteHeaderImage(@Param('id') id: string) {
    // Get existing city to check for header image
    const existing = await this.cityService.findOne(id);

    if (!existing.headerImageUrl) {
      throw new BadRequestException('City does not have a header image');
    }

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete image from storage
    try {
      const key = this.extractKeyFromUrl(existing.headerImageUrl);
      await this.storageService.deleteFile({ bucket, key });
    } catch (error) {
      this.logger.warn(`Failed to delete header image from storage for city ${id}`, error);
      // Continue with database update even if file deletion fails
    }

    // Update city headerImageUrl to null
    await this.prisma.city.update({
      where: { id },
      data: { headerImageUrl: null },
    });

    // Refresh city
    const city = await this.cityService.findOne(id);

    return {
      city,
    };
  }

  @Post(':id/dark-logo')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload dark logo for a city',
    description: 'Upload and process a dark logo image for a city.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Dark logo image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Dark logo uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: CityNotFoundErrorResponseDto,
  })
  async uploadDarkLogo(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Get existing city to check for old dark logo
    const existing = await this.cityService.findOne(id);

    // Validate image
    await this.fileUploadService.validateImage(file);

    // Process image
    const processedFile = await this.fileUploadService.processImage(file);

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete old dark logo if exists
    if (existing.darkLogoUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.darkLogoUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(`Failed to delete old dark logo for city ${id}`, error);
        // Continue with upload even if old file deletion fails
      }
    }

    // Generate storage key
    const key = this.fileUploadService.generateCityDarkLogoKey(id, processedFile.extension);

    // Upload to storage
    const imageUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    // Update city darkLogoUrl directly in database
    await this.prisma.city.update({
      where: { id },
      data: { darkLogoUrl: imageUrl },
    });

    // Refresh city
    const city = await this.cityService.findOne(id);

    return {
      city,
      imageUrl,
    };
  }

  @Delete(':id/dark-logo')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete dark logo for a city',
    description: 'Delete the dark logo for a city from storage and database.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Dark logo deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found or dark logo not found',
    type: CityNotFoundErrorResponseDto,
  })
  async deleteDarkLogo(@Param('id') id: string) {
    // Get existing city to check for dark logo
    const existing = await this.cityService.findOne(id);

    if (!existing.darkLogoUrl) {
      throw new BadRequestException('City does not have a dark logo');
    }

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete image from storage
    try {
      const key = this.extractKeyFromUrl(existing.darkLogoUrl);
      await this.storageService.deleteFile({ bucket, key });
    } catch (error) {
      this.logger.warn(`Failed to delete dark logo from storage for city ${id}`, error);
      // Continue with database update even if file deletion fails
    }

    // Update city darkLogoUrl to null
    await this.prisma.city.update({
      where: { id },
      data: { darkLogoUrl: null },
    });

    // Refresh city
    const city = await this.cityService.findOne(id);

    return {
      city,
    };
  }

  @Post(':id/light-logo')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload light logo for a city',
    description: 'Upload and process a light logo image for a city.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Light logo image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Light logo uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
    type: CityNotFoundErrorResponseDto,
  })
  async uploadLightLogo(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Get existing city to check for old light logo
    const existing = await this.cityService.findOne(id);

    // Validate image
    await this.fileUploadService.validateImage(file);

    // Process image
    const processedFile = await this.fileUploadService.processImage(file);

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete old light logo if exists
    if (existing.lightLogoUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(existing.lightLogoUrl);
        await this.storageService.deleteFile({ bucket, key: oldKey });
      } catch (error) {
        this.logger.warn(`Failed to delete old light logo for city ${id}`, error);
        // Continue with upload even if old file deletion fails
      }
    }

    // Generate storage key
    const key = this.fileUploadService.generateCityLightLogoKey(id, processedFile.extension);

    // Upload to storage
    const imageUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    // Update city lightLogoUrl directly in database
    await this.prisma.city.update({
      where: { id },
      data: { lightLogoUrl: imageUrl },
    });

    // Refresh city
    const city = await this.cityService.findOne(id);

    return {
      city,
      imageUrl,
    };
  }

  @Delete(':id/light-logo')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete light logo for a city',
    description: 'Delete the light logo for a city from storage and database.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier for the city',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Light logo deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found or light logo not found',
    type: CityNotFoundErrorResponseDto,
  })
  async deleteLightLogo(@Param('id') id: string) {
    // Get existing city to check for light logo
    const existing = await this.cityService.findOne(id);

    if (!existing.lightLogoUrl) {
      throw new BadRequestException('City does not have a light logo');
    }

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Delete image from storage
    try {
      const key = this.extractKeyFromUrl(existing.lightLogoUrl);
      await this.storageService.deleteFile({ bucket, key });
    } catch (error) {
      this.logger.warn(`Failed to delete light logo from storage for city ${id}`, error);
      // Continue with database update even if file deletion fails
    }

    // Update city lightLogoUrl to null
    await this.prisma.city.update({
      where: { id },
      data: { lightLogoUrl: null },
    });

    // Refresh city
    const city = await this.cityService.findOne(id);

    return {
      city,
    };
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Extract pathname and remove leading slash and bucket name
      // Format: /bucket-name/cities/cityId/header.webp
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
