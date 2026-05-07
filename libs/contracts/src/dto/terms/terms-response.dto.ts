import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TermsOfUseDto } from './get-terms-response.dto';

// Simplified terms object that matches what's actually returned from acceptTerms
export class TermsSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01' })
  version: string;

  @ApiProperty({ example: 'Terms of Use' })
  title: string;

  @ApiProperty({ example: 'en' })
  locale: string;
}

export class UserTermsAcceptanceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  termsId: string;

  @ApiProperty({ example: '2024-01' })
  version: string;

  @ApiProperty({ example: 'en' })
  locale: string;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  userAgent?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  acceptedAt: Date;

  @ApiPropertyOptional({ type: TermsSummaryDto })
  terms?: TermsSummaryDto;
}

export class AcceptTermsResponseDto {
  @ApiProperty({ type: UserTermsAcceptanceDto })
  data: UserTermsAcceptanceDto;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/terms/accept' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class TermsStatusDataDto {
  @ApiProperty({ example: false })
  hasAccepted: boolean;

  @ApiPropertyOptional({ example: '2024-01' })
  acceptedVersion?: string | null;

  @ApiProperty({ example: '2024-01' })
  latestVersion: string | null;

  @ApiProperty({ example: true })
  needsAcceptance: boolean;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  termsId: string | null;

  @ApiPropertyOptional({ example: '2024-01-08T00:00:00.000Z' })
  gracePeriodEndsAt?: string | null;
}

export class TermsStatusResponseDto {
  @ApiProperty({ type: TermsStatusDataDto })
  data: TermsStatusDataDto;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/terms/status' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class TermsListResponseDto {
  @ApiProperty({ type: [TermsOfUseDto] })
  data: TermsOfUseDto[];

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/terms/all' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
