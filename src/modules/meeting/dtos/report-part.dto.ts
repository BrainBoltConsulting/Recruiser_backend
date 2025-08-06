import { ApiProperty } from '@nestjs/swagger';

export class ReportPartDto {
  @ApiProperty({
    description:
      'Label for the time period (e.g., "January 2024", "Week 1", "Monday")',
  })
  label: string;

  @ApiProperty({ description: 'Start date of this period' })
  startDate: Date;

  @ApiProperty({ description: 'End date of this period' })
  endDate: Date;

  @ApiProperty({ description: 'Number of interviews scheduled in this period' })
  scheduledCount: number;

  @ApiProperty({ description: 'Number of interviews attended in this period' })
  attendedCount: number;
}
