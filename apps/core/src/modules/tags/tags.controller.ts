import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  CreateTagDto,
  TagBadRequestErrorResponseDto,
  TagDeleteApiResponseDto,
  TagFilterDto,
  TagForbiddenErrorResponseDto,
  TagListApiResponseDto,
  TagListResponseDto,
  TagNotFoundErrorResponseDto,
  TagResponseDto,
  TagSingleApiResponseDto,
  TagUnauthorizedErrorResponseDto,
  TagValidationErrorResponseDto,
} from '@kodi/contracts';
import { TagsService } from './tags.service';
import { Public, JwtAuthGuard } from '@kodi/jwt';
import { AdminOnlyGuard } from '@kodi/rbac';

@ApiTags('tags')
@ApiExtraModels(TagListApiResponseDto, TagSingleApiResponseDto, TagDeleteApiResponseDto)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List tags',
    description: 'Retrieve tags with optional provider and text filters.',
  })
  @ApiQuery({
    name: 'provider',
    required: false,
    description: 'Filter tags by provider',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term applied to external value and label',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (1-indexed)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    example: 20,
    description: 'Results per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
    schema: { $ref: getSchemaPath(TagListApiResponseDto) },
  })
  async listTags(@Query() filter: TagFilterDto): Promise<TagListResponseDto> {
    return this.tagsService.listTags(filter);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiParam({ name: 'id', description: 'Tag identifier', example: 'tag_01HZXTY0YK3H2V4C5B6N7P8Q' })
  @ApiResponse({
    status: 200,
    description: 'Tag retrieved successfully',
    schema: { $ref: getSchemaPath(TagSingleApiResponseDto) },
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found',
    type: TagNotFoundErrorResponseDto,
  })
  async getTag(@Param('id') id: string): Promise<TagResponseDto> {
    return this.tagsService.getTagById(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Create tag' })
  @ApiBody({ type: CreateTagDto })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    schema: { $ref: getSchemaPath(TagSingleApiResponseDto) },
  })
  @ApiResponse({
    status: 400,
    description: 'Tag already exists or payload invalid',
    type: TagBadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: TagUnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User lacks permission to create tags',
    type: TagForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed',
    type: TagValidationErrorResponseDto,
  })
  async createTag(@Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return this.tagsService.createTag(dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiOperation({ summary: 'Delete tag' })
  @ApiParam({ name: 'id', description: 'Tag identifier', example: 'tag_01HZXTY0YK3H2V4C5B6N7P8Q' })
  @ApiResponse({
    status: 200,
    description: 'Tag deleted successfully',
    schema: { $ref: getSchemaPath(TagDeleteApiResponseDto) },
  })
  @ApiResponse({
    status: 400,
    description: 'Tag is in use by listings',
    type: TagBadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
    type: TagUnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User lacks permission to delete tags',
    type: TagForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found',
    type: TagNotFoundErrorResponseDto,
  })
  async deleteTag(@Param('id') id: string) {
    await this.tagsService.deleteTag(id);
    return { id };
  }
}
