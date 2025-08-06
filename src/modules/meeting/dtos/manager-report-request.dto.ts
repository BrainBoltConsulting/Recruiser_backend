import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetManagerReportDto {
  @ApiProperty({
    description: 'Start date for the filter (ISO string)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description:
      'End date for custom filter (ISO string). Optional for non-custom filters',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Optional job ID to filter the report by specific job',
  })
  @IsOptional()
  jobId?: string;
}
