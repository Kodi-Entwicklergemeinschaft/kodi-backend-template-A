import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID to resend verification for',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    example: 'EMAIL',
    enum: ['EMAIL', 'SMS'],
    description: 'Type of verification to resend',
  })
  @IsEnum(['EMAIL', 'SMS'])
  type: 'EMAIL' | 'SMS';

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address or phone number to resend verification to',
  })
  @IsString()
  identifier: string;

  @ApiPropertyOptional({
    example: { firstName: 'John', lastName: 'Doe' },
    description: 'Optional metadata to include in the verification email',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
