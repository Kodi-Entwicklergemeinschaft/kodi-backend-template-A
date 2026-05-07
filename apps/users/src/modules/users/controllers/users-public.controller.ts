import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { GetSalutationsResponseDto } from '@kodi/contracts';
import { Public, JwtAuthGuard } from '@kodi/jwt';
import { GetLanguage } from '@kodi/i18n';
import { AdminOnlyGuard } from '@kodi/rbac';

@ApiTags('Users - Public')
@Controller()
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class UsersPublicController {
  constructor(private readonly usersService: UsersService) {}

  @Get('salutations')
  @Public()
  @ApiOperation({
    summary: 'Get available salutations',
    description:
      'Retrieve list of available salutations (titles) in the specified language (public endpoint)',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Language code (e.g., en, de, ar). Defaults to English if not provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Salutations retrieved successfully',
    type: GetSalutationsResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getSalutations(@Query('locale') locale?: string, @GetLanguage() language?: string) {
    const effectiveLocale = locale || language || 'en';
    return this.usersService.getSalutations(effectiveLocale);
  }
}
