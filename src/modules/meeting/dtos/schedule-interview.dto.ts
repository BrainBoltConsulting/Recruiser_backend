import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class ScheduleInterviewDto {
  @ApiProperty()
  @IsString()
  cUuid: string;

  @ApiProperty()
  @IsString()
  jUuid: string;

  @ApiPropertyOptional({
    description:
      'Exact interview start time (ISO 8601). When provided, interview is valid for one hour from this time and a calendar invite is sent. Requires candidateTimezone.',
    example: '2026-05-25T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description:
      'IANA timezone for the candidate (e.g. America/New_York). Required when scheduledDate is provided.',
    example: 'America/New_York',
  })
  @ValidateIf((dto: ScheduleInterviewDto) => Boolean(dto.scheduledDate))
  @IsString()
  @IsNotEmpty()
  candidateTimezone?: string;
}
