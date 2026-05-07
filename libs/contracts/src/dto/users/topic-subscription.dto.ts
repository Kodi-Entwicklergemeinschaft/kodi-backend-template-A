import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeTopicDto {
  @ApiProperty({
    description: 'Topic key (e.g., "CITY_123", "GLOBAL_EVENTS", "ANNOUNCEMENTS")',
    example: 'CITY_123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  topicKey: string;

  @ApiPropertyOptional({
    description: 'City ID (for city-specific topics)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  cityId?: string;
}

export class TopicSubscriptionDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Topic key',
    example: 'CITY_123e4567-e89b-12d3-a456-426614174000',
  })
  topicKey: string;

  @ApiPropertyOptional({
    description: 'City ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  cityId?: string;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;
}

export class TopicSubscriptionListResponseDataDto {
  @ApiProperty({
    description: 'List of topic subscriptions',
    type: [TopicSubscriptionDto],
  })
  subscriptions: TopicSubscriptionDto[];
}

export class TopicSubscriptionListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TopicSubscriptionListResponseDataDto })
  data: TopicSubscriptionListResponseDataDto;

  @ApiProperty({
    example: 'Topic subscriptions retrieved successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/me/topics' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class SubscribeTopicResponseDataDto {
  @ApiProperty({
    description: 'Topic subscription',
    type: TopicSubscriptionDto,
  })
  subscription: TopicSubscriptionDto;
}

export class SubscribeTopicResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: SubscribeTopicResponseDataDto })
  data: SubscribeTopicResponseDataDto;

  @ApiProperty({
    example: 'Topic subscription created successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/me/topics' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class UnsubscribeTopicResponseDataDto {
  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  success: boolean;
}

export class UnsubscribeTopicResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UnsubscribeTopicResponseDataDto })
  data: UnsubscribeTopicResponseDataDto;

  @ApiProperty({
    example: 'Topic subscription removed successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/me/topics/:topicKey' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
