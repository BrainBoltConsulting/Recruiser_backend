import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class ManagerJobFilterDto {
  @ApiProperty({
    description: 'Manager ID',
    example: '5',
  })
  managerId: string;

  @ApiPropertyOptional({
    description:
      'Job ID to filter for this specific manager. If not provided, shows all jobs for this manager',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  jobId?: string;
}

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
    description:
      'Optional job ID to filter the report by specific job for main manager',
  })
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional({
    description:
      'Include hierarchical reporting (direct reports and their reports). Default: false',
    example: true,
    default: false,
  })
  @Transform(({ value }) => (value === 'true' ? true : false))
  @IsOptional()
  @IsBoolean()
  includeHierarchy?: boolean;

  @ApiPropertyOptional({
    description:
      'Independent job filters for each manager in hierarchy. Each manager can have their own job selection.',
    type: [ManagerJobFilterDto],
    example: [
      { managerId: '5', jobId: 'job-uuid-4' }, // Manager 5: show only job 4
      { managerId: '7' }, // Manager 7: show all jobs (no filter)
      { managerId: '10', jobId: 'job-uuid-2' }, // Manager 10: show only job 2
    ],
  })
  @IsOptional()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ManagerJobFilterDto)
  managerJobFilters?: ManagerJobFilterDto[];
}
