import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { TermsService } from './terms.service';
import {
  AcceptTermsDto,
  AcceptTermsResponseDto,
  GetTermsResponseDto,
  CreateTermsDto,
  UpdateTermsDto,
  TermsListResponseDto,
  TermsStatusResponseDto,
  TermsNotFoundErrorResponseDto,
  TermsValidationErrorResponseDto,
  ConflictErrorResponseDto,
  ValidationErrorResponseDto,
} from '@kodi/contracts';
import { JwtAuthGuard, GetCurrentUser, Public } from '@kodi/jwt';
import { AdminOnlyGuard, TermsExempt } from '@kodi/rbac';
import { GetLanguage } from '@kodi/i18n';

@ApiTags('terms')
@Controller('terms')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get('latest')
  @Public()
  @TermsExempt()
  @ApiOperation({
    summary: 'Get latest terms of use',
    description: 'Get the current active terms of use that users must accept',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Locale code (e.g., "en", "de", "ar")',
  })
  @ApiResponse({
    status: 200,
    description: 'Terms retrieved successfully',
    type: GetTermsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No terms found',
    type: TermsNotFoundErrorResponseDto,
  })
  async getLatestTerms(@Query('locale') locale?: string, @GetLanguage() detectedLanguage?: string) {
    // Use query param locale, fallback to Accept-Language header, then default
    const targetLocale = locale || detectedLanguage;
    const terms = await this.termsService.getLatestTerms(targetLocale);
    // Return just the data - TransformInterceptor will wrap it
    return terms;
  }

  @Get('version/:version')
  @Public()
  @TermsExempt()
  @ApiOperation({
    summary: 'Get terms by version',
    description: 'Get specific version of terms of use',
  })
  @ApiParam({
    name: 'version',
    description: 'Terms version (e.g., "2024-01")',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Locale code (e.g., "en", "de", "ar")',
  })
  @ApiResponse({
    status: 200,
    description: 'Terms retrieved successfully',
    type: GetTermsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Terms not found',
    type: TermsNotFoundErrorResponseDto,
  })
  async getTermsByVersion(
    @Param('version') version: string,
    @Query('locale') locale?: string,
    @GetLanguage() detectedLanguage?: string,
  ) {
    // Use query param locale, fallback to Accept-Language header, then default
    const targetLocale = locale || detectedLanguage;
    const terms = await this.termsService.getTermsByVersion(version, targetLocale);
    // Return just the data - TransformInterceptor will wrap it
    return terms;
  }

  @Post('accept')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept terms of use',
    description:
      'Accept the current terms of use. Required after registration. The system automatically detects your language from the Accept-Language header and ensures you accept the terms in your current language. If you attempt to accept terms in a different language, you will receive an error with the correct terms ID.',
  })
  @ApiBody({ type: AcceptTermsDto })
  @ApiResponse({
    status: 200,
    description: 'Terms accepted successfully',
    type: AcceptTermsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or locale mismatch',
    type: TermsValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Terms not found',
    type: TermsNotFoundErrorResponseDto,
  })
  async acceptTerms(
    @Body() dto: AcceptTermsDto,
    @GetCurrentUser('userId') userId: string,
    @GetLanguage() detectedLanguage?: string,
    @Req() req?: Request,
  ) {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || req?.socket.remoteAddress;
    const userAgent = req?.headers['user-agent'];

    // Use query param locale, fallback to Accept-Language header, then DTO locale
    const targetLocale = dto.locale || detectedLanguage;

    const acceptance = await this.termsService.acceptTerms(
      userId,
      dto,
      targetLocale,
      ipAddress as string,
      userAgent,
    );

    // Return just the data - TransformInterceptor will wrap it
    return acceptance;
  }

  @Get('status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Check terms acceptance status',
    description: 'Check if current user has accepted the latest terms',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Locale code (e.g., "en", "de", "ar")',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    type: TermsStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async getAcceptanceStatus(
    @GetCurrentUser('userId') userId: string,
    @Query('locale') locale?: string,
    @GetLanguage() detectedLanguage?: string,
  ) {
    // Use query param locale, fallback to Accept-Language header, then default
    const targetLocale = locale || detectedLanguage;
    return this.termsService.getAcceptanceStatus(userId, targetLocale);
  }

  // Admin endpoints
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new terms version (Admin)',
    description: 'Create a new version of terms of use',
  })
  @ApiBody({ type: CreateTermsDto })
  @ApiResponse({
    status: 201,
    description: 'Terms created successfully',
    type: GetTermsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Terms version already exists',
    type: ConflictErrorResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async createTerms(@Body() dto: CreateTermsDto, @GetCurrentUser() user: any) {
    const userId = user.sub || user.userId;
    const terms = await this.termsService.createTerms(dto, userId);
    // Return just the data - TransformInterceptor will wrap it
    return terms;
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update terms (Admin)',
    description: 'Update existing terms of use',
  })
  @ApiParam({
    name: 'id',
    description: 'Terms ID',
  })
  @ApiBody({ type: UpdateTermsDto })
  @ApiResponse({
    status: 200,
    description: 'Terms updated successfully',
    type: GetTermsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Terms not found',
    type: TermsNotFoundErrorResponseDto,
  })
  async updateTerms(@Param('id') id: string, @Body() dto: UpdateTermsDto) {
    const terms = await this.termsService.updateTerms(id, dto);
    // Return just the data - TransformInterceptor will wrap it
    return terms;
  }

  @Get('all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all terms versions (Admin)',
    description: 'Get all versions of terms of use',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Filter by locale code',
  })
  @ApiResponse({
    status: 200,
    description: 'Terms retrieved successfully',
    type: TermsListResponseDto,
  })
  async getAllTerms(@Query('locale') locale?: string, @GetLanguage() detectedLanguage?: string) {
    // Use query param locale, fallback to Accept-Language header, then default
    const targetLocale = locale || detectedLanguage;
    const terms = await this.termsService.getAllTerms(targetLocale);
    // Return just the data - TransformInterceptor will wrap it
    return terms;
  }
}
