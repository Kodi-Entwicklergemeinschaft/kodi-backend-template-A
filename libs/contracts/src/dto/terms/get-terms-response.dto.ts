import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TermsOfUseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01' })
  version: string;

  @ApiProperty({ example: 'Terms of Use' })
  title: string;

  @ApiProperty({ example: '<p>Full terms content...</p>' })
  content: string;

  @ApiProperty({ example: 'en' })
  locale: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  isLatest: boolean;

  @ApiProperty({ example: 7 })
  gracePeriodDays: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  createdBy?: string;
}

export class GetTermsResponseDto {
  @ApiProperty({ type: TermsOfUseDto })
  data: TermsOfUseDto;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/terms/latest' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
