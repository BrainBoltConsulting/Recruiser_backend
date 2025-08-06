import { ApiProperty } from '@nestjs/swagger';

import { ReportFilterType } from '../../../constants/report-type.enum';
import type { Schedule } from '../../../entities/Schedule';
import { ReportPartDto } from './report-part.dto';

export class ManagerReportSummaryDto {
  @ApiProperty({ description: 'Total number of interview invitations shared' })
  totalInvitesShared: number;

  @ApiProperty({ description: 'Total number of interviews attended' })
  totalInterviewsAttended: number;

  @ApiProperty({ description: 'Attendance rate percentage' })
  attendanceRate: number;
}

export class ManagerReportResponseDto {
  @ApiProperty({ description: 'Manager ID' })
  managerId: string;

  @ApiProperty({ description: 'Filter type used' })
  filterType: ReportFilterType;

  @ApiProperty({ description: 'Start date of the report period' })
  periodStart: Date;

  @ApiProperty({ description: 'End date of the report period' })
  periodEnd: Date;

  @ApiProperty({ description: 'Summary statistics for the period' })
  summary: ManagerReportSummaryDto;

  @ApiProperty({
    type: [ReportPartDto],
    description: 'Breakdown by time periods (months, weeks, days, etc.)',
  })
  parts: ReportPartDto[];

  constructor(data: {
    managerId: string;
    filterType: ReportFilterType;
    startDate: Date;
    endDate: Date;
    schedules: Schedule[];
    parts: ReportPartDto[];
  }) {
    this.managerId = data.managerId;
    this.filterType = data.filterType;
    this.periodStart = data.startDate;
    this.periodEnd = data.endDate;

    const totalInvitesShared = data.schedules.length;
    const totalInterviewsAttended = data.schedules.filter(
      (s) => s.attendedDatetime,
    ).length;
    const attendanceRate =
      totalInvitesShared > 0
        ? Math.round((totalInterviewsAttended / totalInvitesShared) * 100)
        : 0;

    this.summary = {
      totalInvitesShared,
      totalInterviewsAttended,
      attendanceRate,
    };

    this.parts = data.parts;
  }
}
