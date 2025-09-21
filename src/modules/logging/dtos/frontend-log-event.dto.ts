import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class FrontendLogEventDto {
  @ApiProperty({
    description: 'Log level (ERROR, WARN, INFO, DEBUG, TRACE)',
    example: 'INFO'
  })
  @IsString()
  level: string;

  @ApiProperty({
    description: 'Log message',
    example: 'User started interview session'
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'ISO timestamp when the log was created',
    example: '2024-01-15T10:30:00.000Z'
  })
  @IsString()
  timestamp: string;

  @ApiProperty({
    description: 'Additional metadata for the log event',
    example: { candidateId: '123', scheduleId: 456, browser: 'Chrome' }
  })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiProperty({
    description: 'Source of the log (frontend component)',
    example: 'canint-frontend'
  })
  @IsString()
  source: string;

  @ApiProperty({
    description: 'User agent string from the browser',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  @IsString()
  userAgent: string;

  @ApiProperty({
    description: 'URL where the log was generated',
    example: 'https://app.canint.com/meeting/123'
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Session ID for tracking user session',
    example: 'sess_abc123def456'
  })
  @IsString()
  sessionId: string;
}
