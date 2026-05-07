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
  SubscribeTopicDto,
  TopicSubscriptionListResponseDto,
  SubscribeTopicResponseDto,
  UnsubscribeTopicResponseDto,
  UnauthorizedErrorResponseDto,
  NotFoundErrorResponseDto,
} from '@kodi/contracts';
import { GetCurrentUser, JwtAuthGuard } from '@kodi/jwt';
import { AdminOnlyGuard } from '@kodi/rbac';

@ApiTags('Users - Topics')
@Controller('me/topics')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiBearerAuth('JWT-auth')
export class UsersTopicsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get my topic subscriptions',
    description: 'Get all active topic subscriptions for the current authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Topic subscriptions retrieved successfully',
    type: TopicSubscriptionListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getMyTopicSubscriptions(@GetCurrentUser('userId') userId: string) {
    const subscriptions = await this.usersService.getTopicSubscriptions(userId);
    return { subscriptions };
  }

  @Post()
  @ApiOperation({
    summary: 'Subscribe to topic',
    description: 'Subscribe the current authenticated user to a topic',
  })
  @ApiBody({ type: SubscribeTopicDto })
  @ApiResponse({
    status: 200,
    description: 'Topic subscription created successfully',
    type: SubscribeTopicResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async subscribeTopic(@GetCurrentUser('userId') userId: string, @Body() dto: SubscribeTopicDto) {
    const subscription = await this.usersService.subscribeTopic(userId, dto);
    return { subscription };
  }

  @Delete(':topicKey')
  @ApiOperation({
    summary: 'Unsubscribe from topic',
    description: 'Unsubscribe the current authenticated user from a topic',
  })
  @ApiParam({
    name: 'topicKey',
    description: 'Topic key',
    example: 'CITY_123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Topic subscription removed successfully',
    type: UnsubscribeTopicResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Topic subscription not found',
    type: NotFoundErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async unsubscribeTopic(
    @GetCurrentUser('userId') userId: string,
    @Param('topicKey') topicKey: string,
  ) {
    return this.usersService.unsubscribeTopic(userId, topicKey);
  }
}
