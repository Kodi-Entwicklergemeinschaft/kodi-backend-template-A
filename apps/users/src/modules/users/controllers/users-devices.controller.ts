import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from '../users.service';
import {
  RegisterDeviceDto,
  DeviceListResponseDto,
  RegisterDeviceResponseDto,
  DeleteDeviceResponseDto,
  UnauthorizedErrorResponseDto,
  NotFoundErrorResponseDto,
} from '@kodi/contracts';
import { GetCurrentUser, JwtAuthGuard } from '@kodi/jwt';
import { AdminOnlyGuard } from '@kodi/rbac';

@ApiTags('Users - Devices')
@Controller('me/devices')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiBearerAuth('JWT-auth')
export class UsersDevicesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get my devices',
    description: 'Get all active devices for the current authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Devices retrieved successfully',
    type: DeviceListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getMyDevices(@GetCurrentUser('userId') userId: string) {
    const devices = await this.usersService.getDevices(userId);
    return { devices };
  }

  @Post()
  @ApiOperation({
    summary: 'Register device',
    description: 'Register or update a device for the current authenticated user',
  })
  @ApiBody({ type: RegisterDeviceDto })
  @ApiResponse({
    status: 200,
    description: 'Device registered successfully',
    type: RegisterDeviceResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async registerDevice(@GetCurrentUser('userId') userId: string, @Body() dto: RegisterDeviceDto) {
    const device = await this.usersService.registerDevice(userId, dto);
    return { device };
  }

  @Delete(':deviceId')
  @ApiOperation({
    summary: 'Delete device',
    description: 'Deactivate a device for the current authenticated user',
  })
  @ApiParam({
    name: 'deviceId',
    description: 'Device ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Device deleted successfully',
    type: DeleteDeviceResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found',
    type: NotFoundErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async deleteDevice(
    @GetCurrentUser('userId') userId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.usersService.deleteDevice(userId, deviceId);
  }
}
