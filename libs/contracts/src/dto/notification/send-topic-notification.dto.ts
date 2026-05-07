import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendTopicNotificationDto {
  @ApiProperty({
    description: 'FCM topic to broadcast to',
    example: 'warnings',
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Kodigutschein now available',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'Ein Gutschein, so viele Möglichkeiten',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({
    description: 'Additional data payload sent with the FCM message',
    example: { kind: 'tile', tileId: 'abc123' },
  })
  @IsObject()
  @IsOptional()
  fcmData?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'City ID for multi-city Firebase project selection',
    example: 'city_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @IsString()
  @IsOptional()
  cityId?: string;
}
