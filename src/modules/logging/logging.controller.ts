import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FrontendLogsDto } from './dtos';

@ApiTags('Logging')
@Controller('api/frontend-logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive frontend logs and forward to CloudWatch' })
  @ApiResponse({ status: 200, description: 'Logs received successfully' })
  @ApiResponse({ status: 400, description: 'Invalid log data' })
  async receiveFrontendLogs(@Body() logsDto: FrontendLogsDto) {
    try {
      await this.loggingService.processFrontendLogs(logsDto.events);
      return { success: true, message: `Processed ${logsDto.events.length} log events` };
    } catch (error) {
      console.error('Error processing frontend logs:', error);
      throw error;
    }
  }
}
