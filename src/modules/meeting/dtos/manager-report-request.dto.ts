import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetManagerReportDto {
  @ApiProperty({
    description: 'Start date for the filter (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description:
      'End date for custom filter (ISO string). Optional for non-custom filters',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
