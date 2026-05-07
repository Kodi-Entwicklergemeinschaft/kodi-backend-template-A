import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCurrentUser, JwtAuthGuard } from '@kodi/jwt';
import {
  AddFavoriteDto,
  AddFavoriteResponseDto,
  FavoriteFilterDto,
  ListingNotFoundErrorResponseDto,
  ListListingsResponseDto,
  RemoveFavoriteResponseDto,
  UnauthorizedErrorResponseDto,
  ValidationErrorResponseDto,
} from '@kodi/contracts';
import { ListingsService } from './listings.service';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle listing favorite status',
    description:
      "Add or remove a listing from the current user's favorites based on the isFavorite field",
  })
  @ApiBody({
    type: AddFavoriteDto,
    examples: {
      add: {
        summary: 'Add listing to favorites',
        value: {
          listingId: '123e4567-e89b-12d3-a456-426614174000',
          isFavorite: true,
        },
      },
      remove: {
        summary: 'Remove listing from favorites',
        value: {
          listingId: '123e4567-e89b-12d3-a456-426614174000',
          isFavorite: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Listing added to favorites successfully',
    type: AddFavoriteResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Listing removed from favorites successfully',
    type: RemoveFavoriteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or listing already favorited',
    type: ValidationErrorResponseDto,
    content: {
      'application/json': {
        example: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/favorites',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 400,
          details: {
            message: ['listingId must be a UUID', 'isFavorite must be a boolean'],
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
    status: 404,
    description: 'Listing not found or favorite not found',
    type: ListingNotFoundErrorResponseDto,
  })
  async toggleFavorite(@GetCurrentUser('userId') userId: string, @Body() body: AddFavoriteDto) {
    const result = await this.listingsService.toggleFavorite(
      userId,
      body.listingId,
      body.isFavorite,
    );
    return result;
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user favorites',
    description:
      "List the current user's favorited listings. Query parameters match GET /listings (city, category, status, dates, quickFilter, geo, sort, pagination, etc.) but results are restricted to favorites. Returns the same response shape as the listings list endpoint.",
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred response language (e.g. de, en). Used with search to match translated listing content when translations exist.',
    example: 'de',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user favorites retrieved successfully',
    type: ListListingsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed. When quickFilter is "nearby", userLat and userLng are required.',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getUserFavorites(
    @GetCurrentUser('userId') userId: string,
    @Query() filter: FavoriteFilterDto,
  ) {
    if (filter.quickFilter === 'nearby') {
      if (filter.userLat === undefined || filter.userLng === undefined) {
        throw new BadRequestException({
          errorCode: 'VALIDATION_ERROR',
          message: 'userLat and userLng are required when quickFilter is "nearby"',
        });
      }
    }

    return this.listingsService.getUserFavorites(userId, filter);
  }
}
