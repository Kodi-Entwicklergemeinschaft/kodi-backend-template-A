import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SendNotificationDto } from './send-notification.dto';

export class BulkNotificationDto extends SendNotificationDto {
  @ApiPropertyOptional({
    description: 'Optional filters for bulk notification',
    example: { role: 'CITIZEN', isActive: true },
  })
  @IsObject()
  @IsOptional()
  filters?: {
    role?: string;
    isActive?: boolean;
    [key: string]: any;
  };
}
