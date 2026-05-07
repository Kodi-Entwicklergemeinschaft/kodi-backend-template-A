import { ApiProperty } from '@nestjs/swagger';

export class SalutationDto {
  @ApiProperty({ example: 'MR', description: 'Salutation code' })
  code: string;

  @ApiProperty({ example: 'Mr', description: 'Localized label for the salutation' })
  label: string;

  @ApiProperty({ example: 'en', description: 'Language/locale code' })
  locale: string;

  @ApiProperty({ example: 1, description: 'Sort order for display' })
  sortOrder: number;
}

export class GetSalutationsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [SalutationDto] })
  data: SalutationDto[];

  @ApiProperty({ example: 'Salutations retrieved successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/salutations' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
