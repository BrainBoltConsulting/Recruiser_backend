/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';

import { ReportFilterType } from '../../../constants/report-type.enum';
import type { Schedule } from '../../../entities/Schedule';
import { ReportPartDto } from './report-part.dto';

export class ManagerReportSummaryDto {
  @ApiProperty({ description: 'Total number of interview invitations shared' })
  totalInvitesShared: number;

  @ApiProperty({ description: 'Total number of interviews attended' })
  totalInterviewsAttended: number;

  @ApiProperty({ description: 'Total time saved in hours' })
  timeSaved: number;

  @ApiProperty({ description: 'Total number of resumes uploaded' })
  totalResumesUploaded: number;

  @ApiProperty({ description: 'Number of unique jobs' })
  uniqueJobsCount: number;
}

export class HierarchicalReportDto {
  @ApiProperty({ description: 'Manager ID of the direct report' })
  managerId: string;

  @ApiProperty({ description: 'Manager email' })
  managerEmail: string;

  @ApiProperty({ description: 'Manager first name' })
  firstName: string;

  @ApiProperty({ description: 'Manager last name' })
  lastName: string;

  @ApiProperty({ description: 'Summary for this manager' })
  summary: ManagerReportSummaryDto;

  @ApiProperty({
    type: [ReportPartDto],
    description: 'Breakdown by time periods for this manager',
  })
  parts: ReportPartDto[];

  @ApiProperty({
    type: [HierarchicalReportDto],
    description:
      'Reports from managers who report to this manager (nested hierarchy)',
    required: false,
  })
  subReports?: HierarchicalReportDto[];
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

  @ApiProperty({
    type: [HierarchicalReportDto],
    description: 'Hierarchical reports from direct reports and their reports',
    required: false,
  })
  hierarchicalReports?: HierarchicalReportDto[];

  constructor(data: {
    managerId: string;
    filterType: ReportFilterType;
    startDate: Date;
    endDate: Date;
    schedules: Schedule[];
    parts: ReportPartDto[];
    hierarchicalReports?: HierarchicalReportDto[];
    timeConfig?: {
      coordHrs: number;
      interviewHrs: number;
      followupHrs: number;
    };
    totalJobsCount?: number;
    allJobTitles?: string[];
  }) {
    this.managerId = data.managerId;
    this.filterType = data.filterType;
    this.periodStart = data.startDate;
    this.periodEnd = data.endDate;

    const totalInvitesShared = data.schedules.length;
    const totalInterviewsAttended = data.schedules.filter(
      (s) => s.attendedDatetime,
    ).length;

    // Calculate total resumes uploaded from parts
    const totalResumesUploaded = data.parts.reduce(
      (total: number, part: ReportPartDto) => total + (part.resumesUploadedCount || 0),
      0,
    );

    // Calculate time savings
    const timeConfig = data.timeConfig || {
      coordHrs: 0,
      interviewHrs: 0,
      followupHrs: 0,
    };

    const timeSaved =
      timeConfig.coordHrs * totalInvitesShared +
      timeConfig.interviewHrs * totalInterviewsAttended +
      timeConfig.followupHrs * totalInvitesShared;

    // Use provided job data or fall back to extracting from schedules
    const uniqueJobsCount = data.totalJobsCount || 0;

    this.summary = {
      totalInvitesShared,
      totalInterviewsAttended,
      timeSaved: Math.round(timeSaved * 100) / 100, // Round to 2 decimal places
      totalResumesUploaded,
      uniqueJobsCount: uniqueJobsCount || 0,
    };

    this.parts = data.parts;
    this.hierarchicalReports = data.hierarchicalReports;
  }
}
