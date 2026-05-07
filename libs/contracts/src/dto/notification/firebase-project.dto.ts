import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

export class CreateFirebaseProjectDto {
  @ApiPropertyOptional({
    description: 'City ID (null for default project)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiProperty({
    description: 'Firebase project ID',
    example: 'my-firebase-project',
  })
  @IsString()
  projectId: string;

  @ApiProperty({
    description: 'Human-readable project name',
    example: 'Kodi Default Project',
  })
  @IsString()
  projectName: string;

  @ApiProperty({
    description: 'Firebase service account credentials (will be encrypted)',
    example: {
      type: 'service_account',
      project_id: 'my-project',
      // ... other Firebase credentials
    },
  })
  @IsObject()
  credentials: any;

  @ApiPropertyOptional({
    description: 'Whether this is the default project for Kodi app',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Additional configuration metadata',
    example: { region: 'us-central1' },
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class UpdateFirebaseProjectDto {
  @ApiPropertyOptional({
    description: 'Firebase project ID',
    example: 'my-firebase-project',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Human-readable project name',
    example: 'Kodi Default Project',
  })
  @IsString()
  @IsOptional()
  projectName?: string;

  @ApiPropertyOptional({
    description: 'Firebase service account credentials (will be encrypted)',
    example: {
      type: 'service_account',
      project_id: 'my-project',
      // ... other Firebase credentials
    },
  })
  @IsObject()
  @IsOptional()
  credentials?: any;

  @ApiPropertyOptional({
    description: 'Whether this is the default project for Kodi app',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the project is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Additional configuration metadata',
    example: { region: 'us-central1' },
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class FirebaseProjectResponseDto {
  @ApiProperty({
    description: 'Firebase project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'City ID (null for default project)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  cityId?: string;

  @ApiProperty({
    description: 'Firebase project ID',
    example: 'my-firebase-project',
  })
  projectId: string;

  @ApiProperty({
    description: 'Human-readable project name',
    example: 'Kodi Default Project',
  })
  projectName: string;

  @ApiProperty({
    description: 'Whether the project is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether this is the default project',
    example: false,
  })
  isDefault: boolean;

  @ApiPropertyOptional({
    description: 'Additional configuration metadata',
    example: { region: 'us-central1' },
  })
  metadata?: any;

  @ApiProperty({
    description: 'Created at timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
  })
  updatedAt: Date;
}

export class CreateCityFirebaseProjectDto extends OmitType(CreateFirebaseProjectDto, [
  'cityId',
  'isDefault',
] as const) {}
