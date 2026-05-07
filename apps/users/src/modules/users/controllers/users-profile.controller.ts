import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../users.service';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  GetProfileResponseDto,
  UpdateProfileResponseDto,
  ChangePasswordResponseDto,
  DeleteAccountResponseDto,
  ValidationErrorResponseDto,
  UnauthorizedErrorResponseDto,
  BadRequestErrorResponseDto,
  UploadProfilePhotoResponseDto,
} from '@kodi/contracts';
import { GetCurrentUser, JwtAuthGuard } from '@kodi/jwt';
import { AdminOnlyGuard } from '@kodi/rbac';
import { FileUploadService } from '@kodi/storage';
import { ConfigService } from '@kodi/config';
import { SuccessMessage } from '@kodi/interceptors';

@ApiTags('Users - Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiBearerAuth('JWT-auth')
export class UsersProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileUploadService: FileUploadService,
    private readonly configService: ConfigService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get my profile',
    description: 'Get the current authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: GetProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getProfile(@GetCurrentUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @SuccessMessage('PROFILE_UPDATED')
  @ApiOperation({
    summary: 'Update my profile',
    description: 'Update the current authenticated user profile',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UpdateProfileResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async updateProfile(@GetCurrentUser('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload profile photo',
    description: 'Upload and process a profile photo for the current authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile photo uploaded successfully',
    type: UploadProfilePhotoResponseDto,
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
  async uploadProfilePhoto(
    @GetCurrentUser('userId') userId: string,
    @UploadedFile() file: any,
  ): Promise<UploadProfilePhotoResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate image
    await this.fileUploadService.validateImage(file);

    // Process image (resize to 400x400, optimize)
    const processedFile = await this.fileUploadService.processProfilePhoto(file);

    // Get default bucket
    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    // Generate storage key
    const key = this.fileUploadService.generateUserProfilePhotoKey(userId, processedFile.extension);

    // Upload to storage
    const photoUrl = await this.fileUploadService.uploadFile(processedFile, bucket, key);

    // Update user profile in database
    await this.usersService.updateProfile(userId, {
      profilePhotoUrl: photoUrl,
    });

    // Get full profile with city assignments
    const profileData = await this.usersService.getProfile(userId);

    // Transform profile data to match DTO structure
    const transformedProfileData = {
      id: profileData.id,
      email: profileData.email ?? '',
      username: profileData.username ?? '',
      firstName: profileData.firstName ?? '',
      lastName: profileData.lastName ?? '',
      salutationCode: profileData.salutationCode ?? undefined,
      role: profileData.role,
      hasVehicle: profileData.hasVehicle ?? false,
      isActive: profileData.isActive,
      createdAt:
        profileData.createdAt instanceof Date
          ? profileData.createdAt.toISOString()
          : profileData.createdAt,
      updatedAt:
        profileData.updatedAt instanceof Date
          ? profileData.updatedAt.toISOString()
          : profileData.updatedAt,
      cityAssignments: profileData.cityAssignments.map((assignment) => ({
        cityId: assignment.cityId,
        role: assignment.role,
        canManageAdmins: assignment.canManageAdmins,
        createdAt:
          assignment.createdAt instanceof Date
            ? assignment.createdAt.toISOString()
            : assignment.createdAt,
      })),
    };

    // Construct GetProfileResponseDto structure
    const profile: GetProfileResponseDto = {
      success: true,
      data: transformedProfileData,
      message: 'Profile photo uploaded successfully',
      timestamp: new Date().toISOString(),
      path: '/profile/photo',
      statusCode: 200,
    };

    return {
      profile,
      photoUrl,
    };
  }

  @Post('me/change-password')
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the password for the current authenticated user',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - current password incorrect',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async changePassword(@GetCurrentUser('userId') userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  @Delete('me')
  @SuccessMessage('ACCOUNT_DELETED')
  @ApiOperation({
    summary: 'Permanently delete my account',
    description:
      'Permanently delete the current authenticated user account. This action is irreversible and will remove all associated data including devices and subscriptions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account permanently deleted successfully',
    type: DeleteAccountResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@GetCurrentUser('userId') userId: string) {
    return this.usersService.permanentDeleteAccount(userId);
  }
}
