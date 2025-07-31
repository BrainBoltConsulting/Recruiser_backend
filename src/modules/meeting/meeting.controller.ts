import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

import { ApiFile } from '../../decorators/swagger.decorator';
import { FileSizeGuard } from '../../guards/file-size.guard';
import { IsInterviewFinishedEarlierDto } from './dtos/is-interview-finished-earlier.dto';
import { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { StartInterviewDto } from './dtos/start-interview.dto';
import { MeetingService } from './meeting.service';
import { InviteToInterviewDto } from './dtos/invite-to-interview.dto';

@Controller('meetings')
@ApiTags('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get('/interview/by-link/:meetingPostfix')
  async getMeetingByMeetingUrl(
    @Param('meetingPostfix') meetingPostfix: string,
  ) {
    return this.meetingService.getMeetingByMeetingLink(meetingPostfix);
  }

  @Post('/schedule')
  @HttpCode(HttpStatus.OK)
  async scheduleInterview(@Body() scheduleInterviewDto: ScheduleInterviewDto) {
    return this.meetingService.scheduleInterview(scheduleInterviewDto);
  }

  // tmp solution
  // @AuthWithoutRequiredUser()
  @Post('/schedule/:id/start')
  @HttpCode(HttpStatus.OK)
  async startInterview(
    @Param('id') id: string,
    @Body() startInterviewDto: StartInterviewDto,
    // @AuthUser() user: Candidate
  ) {
    // tmp solution
    // return this.meetingService.startInterview(id, user)
    return this.meetingService.startInterview(id, startInterviewDto);
  }

  @Post('/schedule/:scheduleId/finish')
  // @UseInterceptors(FileInterceptor('videoFile'))
  // @UseGuards(new FileSizeGuard(10 * 1024 * 1024))
  // @ApiFile([{ name: 'videoFile' }], {
  //   okResponseData: {
  //     description: 'finish-interview',
  //   },
  // })
  @HttpCode(HttpStatus.OK)
  async finishInterview(
    @Param('scheduleId') scheduleId: string,
    @Query() isInterviewFinishedEarlierDto: IsInterviewFinishedEarlierDto,
    // @UploadedFile() file: Express.Multer.File
  ) {
    return this.meetingService.finishInterview(
      scheduleId,
      isInterviewFinishedEarlierDto,
    );
  }

  @Get('/schedule/:scheduleId')
  @HttpCode(HttpStatus.OK)
  async getInterviewById(@Param('scheduleId') scheduleId: string) {
    return this.meetingService.getInterviewByScheduleId(scheduleId);
  }

  @Post('/schedule/:scheduleId/invite')
  @HttpCode(HttpStatus.OK)
  async sendInvitationToCandidate(
    @Param('scheduleId') scheduleId: string,
    @Body() inviteToInterviewDto: InviteToInterviewDto,

  ) {
    return this.meetingService.sendInvitionToCandidate(scheduleId, inviteToInterviewDto);
  }

  // tmp solution
  // @AuthWithoutRequiredUser()
  @Post('/schedule/:scheduleId/questions/:questionId/recording')
  @UseInterceptors(FileInterceptor('videoFile'))
  @UseGuards(new FileSizeGuard(10 * 1024 * 1024))
  @ApiFile([{ name: 'videoFile' }], {
    okResponseData: {
      description: 'finish-interview',
    },
  })
  @HttpCode(HttpStatus.OK)
  async saveRecordingForQuestionByMeeting(
    @Param('scheduleId') scheduleId: string,
    @Param('questionId') questionId: string,
    @UploadedFile() file: Express.Multer.File,
    // @AuthUser() user: Candidate
  ) {
    // tmp solution
    // return this.meetingService.saveRecordingForQuestionByMeeting(file, scheduleId, questionId, user)
    return this.meetingService.saveRecordingForQuestionByMeeting(
      file,
      scheduleId,
      questionId,
    );
  }

  // tmp solution
  // @AuthWithoutRequiredUser()
  @Post('/schedule/:scheduleId/questions/:questionId/cheat-detected')
  @HttpCode(HttpStatus.OK)
  async saveCheatingForQuestionByMeeting(
    @Param('scheduleId') scheduleId: string,
    @Param('questionId') questionId: string,
    // @AuthUser() user: Candidate
  ) {
    // tmp solution
    // return this.meetingService.saveCheatingForQuestionByMeeting(scheduleId, questionId, user)
    return this.meetingService.saveCheatingForQuestionByMeeting(
      scheduleId,
      questionId,
    );
  }

  @Post('/schedule/:scheduleId/interview-multipart-chunk')
  @UseInterceptors(FileInterceptor('chunk'))
  @HttpCode(HttpStatus.OK)
  async uploadMultipartChunk(
    @Param('scheduleId') scheduleId: string,
    @UploadedFile() chunk: Express.Multer.File,
    @Body() body: { uploadId: string, partNumber: number, s3Key: string }
  ) {
    return this.meetingService.uploadMultipartChunk(scheduleId, body.s3Key, chunk, body.uploadId, body.partNumber);
  }
  
  @Post('/schedule/:scheduleId/interview-multipart-complete')
  @HttpCode(HttpStatus.OK)
  async completeMultipartUpload(
    @Param('scheduleId') scheduleId: string,
    @Body() body: { uploadId: string, parts: { ETag: string, PartNumber: number }[], s3Key: string }
  ) {
    return this.meetingService.completeMultipartUpload(scheduleId, body.s3Key, body.uploadId, body.parts);
  }
}
