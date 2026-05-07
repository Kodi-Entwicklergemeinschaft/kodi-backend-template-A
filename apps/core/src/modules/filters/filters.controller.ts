import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilterQueryDto, FilterListResponseDto } from '@kodi/contracts';
import { FiltersService } from './filters.service';
import { Public } from '@kodi/jwt';

@ApiTags('filters')
@Controller('filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List quick filters',
    description:
      'Retrieve available filter values for populating UI dropdowns. ' +
      'Supports filtering by field type, listing type, provider, and active status. ' +
      'Pass a locale to get translated labels.',
  })
  @ApiQuery({
    name: 'field',
    required: false,
    description: 'Filter by field type (e.g., "category", "cuisine_type", "feature")',
  })
  @ApiQuery({
    name: 'listingType',
    required: false,
    description: 'Filter by listing type (e.g., "Gastro", "POI")',
  })
  @ApiQuery({ name: 'provider', required: false, description: 'Filter by provider' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for value or label' })
  @ApiQuery({
    name: 'locale',
    required: false,
    description: 'Locale for translated labels (e.g., "en", "de")',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'pageSize', required: false, example: 20, description: 'Results per page' })
  @ApiResponse({
    status: 200,
    description: 'Filters retrieved successfully',
    type: FilterListResponseDto,
  })
  async listFilters(@Query() query: FilterQueryDto): Promise<FilterListResponseDto> {
    return this.filtersService.listFilters(query);
  }
}
