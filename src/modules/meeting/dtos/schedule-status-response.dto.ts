/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';

export enum ScheduleStatusEnum {
  /** Interview not yet started (candidate has not joined) */
  SCHEDULED = 'SCHEDULED',
  /** Candidate has joined; interview in progress */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Interview has been finished */
  COMPLETED = 'COMPLETED',
}

/** Report status: only meaningful when interview is COMPLETED */
export enum ReportStatusEnum {
  /** Report is ready and available */
  COMPLETED = 'COMPLETED',
  /** Interview done but report not ready yet (generation in progress) */
  IN_PROGRESS = 'IN_PROGRESS',
}

export class ScheduleStatusCandidateDto {
  @ApiProperty()
  candidateId: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ nullable: true })
  phoneNo: string | null;
}

export class ScheduleStatusManagerDto {
  @ApiProperty()
  managerId: string;

  @ApiProperty()
  managerEmail: string;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ nullable: true })
  company: string | null;
}

export class ScheduleStatusJobDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  jobTitle: string;

  @ApiProperty({ nullable: true })
  yearsOfExp: number | null;

  @ApiProperty({ nullable: true })
  jobDesc: string | null;

  @ApiProperty({ type: ScheduleStatusManagerDto })
  manager: ScheduleStatusManagerDto;
}

/** Report score item linked to a report by reportId */
export class ScheduleStatusReportScoreDto {
  @ApiProperty()
  rsId: string;

  @ApiProperty()
  reportId: string;

  @ApiProperty({ nullable: true, description: 'Technical score' })
  ts: number | null;

  @ApiProperty({ nullable: true, description: 'Communication score' })
  cs: number | null;

  @ApiProperty({ nullable: true, description: 'Job score' })
  js: number | null;

  @ApiProperty({ nullable: true, description: 'DS score' })
  ds: number | null;

  @ApiProperty({ nullable: true })
  reportText: string | null;

  @ApiProperty({ nullable: true })
  reportRemarks: string | null;

  @ApiProperty({ nullable: true })
  createdOn: Date;

  @ApiProperty({ nullable: true })
  updatedAt: Date | null;
}

/** Report master linked to candidate by candidateId */
export class ScheduleStatusReportMasterDto {
  @ApiProperty()
  reportId: string;

  @ApiProperty({
    nullable: true,
    description: 'Raw S3 key for the report file',
  })
  reportS3key: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Presigned URL to access the report file (expires in 24h)',
  })
  reportUrl: string | null;

  @ApiProperty({ nullable: true })
  review: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  updatedAt: Date | null;

  @ApiProperty({
    type: [ScheduleStatusReportScoreDto],
    description: 'Scores linked by reportId',
  })
  reportScores: ScheduleStatusReportScoreDto[];
}

/** Report status for the schedule's candidate (reportMaster by candidateId, reportScores by reportId) */
export class ScheduleStatusReportStatusDto {
  @ApiProperty({
    enum: ReportStatusEnum,
    nullable: true,
    description:
      'COMPLETED = report is ready; IN_PROGRESS = interview done, report not ready yet; null = interview not done, report N/A',
  })
  status: ReportStatusEnum | null;

  @ApiProperty({
    type: ScheduleStatusReportMasterDto,
    nullable: true,
    description: 'Report master for this candidate; null if no report exists',
  })
  reportMaster: ScheduleStatusReportMasterDto | null;
}

export class ScheduleStatusResponseDto {
  @ApiProperty()
  scheduleId: string;

  @ApiProperty({
    enum: ScheduleStatusEnum,
    description: 'Current status of the schedule',
  })
  status: ScheduleStatusEnum;

  @ApiProperty({ nullable: true })
  scheduledDatetime: Date | null;

  @ApiProperty({ nullable: true })
  meetingLink: string | null;

  @ApiProperty({
    nullable: true,
    description: 'When the candidate joined the interview',
  })
  attendedDatetime: Date | null;

  @ApiProperty()
  createdOn: Date;

  @ApiProperty({ nullable: true })
  updatedAt: Date | null;

  @ApiProperty()
  candidateId: number;

  @ApiProperty()
  jobId: string;

  @ApiProperty({ type: ScheduleStatusCandidateDto })
  candidate: ScheduleStatusCandidateDto;

  @ApiProperty({ type: ScheduleStatusJobDto })
  job: ScheduleStatusJobDto;

  @ApiProperty({
    type: ScheduleStatusReportStatusDto,
    description:
      'Report status: reportMaster by candidateId, reportScores by reportId',
  })
  reportStatus: ScheduleStatusReportStatusDto;
}
