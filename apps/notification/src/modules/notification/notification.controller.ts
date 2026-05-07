import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
  SendNotificationDto,
  BulkNotificationDto,
  CreateFirebaseProjectDto,
  UpdateFirebaseProjectDto,
  CreateCityFirebaseProjectDto,
  FirebaseProjectResponseDto,
} from '@kodi/contracts';
import { JwtAuthGuard } from '@kodi/jwt';
import { SuperAdminOnly, AdminOnlyGuard } from '@kodi/rbac';

@ApiTags('notification')
@Controller()
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('notify')
  @ApiOperation({ summary: 'Send a notification to a user' })
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get notifications for a user' })
  async getUserNotifications(@Param('userId') userId: string, @Query('status') status?: string) {
    return this.notificationService.getUserNotifications(userId, status);
  }

  // Dashboard endpoints for bulk notifications
  @Post('bulk/city/:cityId')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Send bulk notifications to all users in a city' })
  @ApiParam({ name: 'cityId', description: 'City ID' })
  @ApiResponse({ status: 200, description: 'Bulk notifications sent successfully' })
  async sendBulkToCity(@Param('cityId') cityId: string, @Body() dto: BulkNotificationDto) {
    return this.notificationService.sendBulkToCity(cityId, dto);
  }

  @Post('bulk/all')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Send bulk notifications to all active users' })
  @ApiResponse({ status: 200, description: 'Bulk notifications sent successfully' })
  async sendBulkToAll(@Body() dto: BulkNotificationDto) {
    return this.notificationService.sendBulkToAll(dto);
  }

  // Firebase project management endpoints
  @Get('firebase-projects')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Get all Firebase projects' })
  @ApiResponse({
    status: 200,
    description: 'List of Firebase projects',
    type: [FirebaseProjectResponseDto],
  })
  async getFirebaseProjects(): Promise<FirebaseProjectResponseDto[]> {
    return this.notificationService.getFirebaseProjects();
  }

  @Post('firebase-projects')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Create a new Firebase project' })
  @ApiResponse({
    status: 201,
    description: 'Firebase project created successfully',
    type: FirebaseProjectResponseDto,
  })
  async createFirebaseProject(
    @Body() dto: CreateFirebaseProjectDto,
  ): Promise<FirebaseProjectResponseDto> {
    return this.notificationService.createFirebaseProject(dto);
  }

  @Post('cities/:cityId/firebase-project')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Create or replace Firebase project config for a city' })
  @ApiParam({ name: 'cityId', description: 'City ID' })
  @ApiResponse({
    status: 200,
    description: 'Firebase project configuration saved for the city',
    type: FirebaseProjectResponseDto,
  })
  async upsertCityFirebaseProject(
    @Param('cityId') cityId: string,
    @Body() dto: CreateCityFirebaseProjectDto,
  ): Promise<FirebaseProjectResponseDto> {
    return this.notificationService.upsertCityFirebaseProject(cityId, dto);
  }

  @Patch('firebase-projects/:id')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Update a Firebase project' })
  @ApiParam({ name: 'id', description: 'Firebase project ID' })
  @ApiResponse({
    status: 200,
    description: 'Firebase project updated successfully',
    type: FirebaseProjectResponseDto,
  })
  async updateFirebaseProject(
    @Param('id') id: string,
    @Body() dto: UpdateFirebaseProjectDto,
  ): Promise<FirebaseProjectResponseDto> {
    return this.notificationService.updateFirebaseProject(id, dto);
  }

  @Delete('firebase-projects/:id')
  @SuperAdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a Firebase project' })
  @ApiParam({ name: 'id', description: 'Firebase project ID' })
  @ApiResponse({ status: 204, description: 'Firebase project deactivated successfully' })
  async deleteFirebaseProject(@Param('id') id: string): Promise<void> {
    return this.notificationService.deleteFirebaseProject(id);
  }
}
