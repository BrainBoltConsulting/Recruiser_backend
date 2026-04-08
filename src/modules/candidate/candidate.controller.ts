import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CandidateService } from './candidate.service';

@Controller('candidates')
@ApiTags('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Delete(':id/interviews')
  @HttpCode(HttpStatus.OK)
  async deleteCandidateInterviews(@Param('id') cUuid: string) {
    return this.candidateService.deleteCandidateInterviews(cUuid);
  }

  @Post(':id/send-interview-completion-notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send interview completion notification',
    description:
      'Sends an email to the manager when a candidate completes their interview, and notifies ' +
      'internal resources (assessment/Greenhouse) via PATCH /assessment/mark_completed/:scheduleId. ' +
      'scheduleId is resolved from the schedule table by candidate id (most recent schedule).',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The candidate UUID (c_uuid)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Interview completion notification sent successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Candidate not found or no associated manager found',
  })
  async sendInterviewCompletionNotification(@Param('id') cUuid: string) {
    await this.candidateService.sendInterviewCompletionNotificationToManager(
      cUuid,
    );

    return { message: 'Interview completion notification sent successfully' };
  }
}
