import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FrontendLogEventDto } from './frontend-log-event.dto';

export class FrontendLogsDto {
  @ApiProperty({
    description: 'Array of frontend log events to be processed',
    type: [FrontendLogEventDto],
    example: [
      {
        level: 'INFO',
        message: 'User started interview session',
        timestamp: '2024-01-15T10:30:00.000Z',
        metadata: { candidateId: '123', scheduleId: 456 },
        source: 'canint-frontend',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url: 'https://app.canint.com/meeting/123',
        sessionId: 'sess_abc123def456'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrontendLogEventDto)
  events: FrontendLogEventDto[];
}
