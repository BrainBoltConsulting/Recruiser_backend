import { StartInterviewDto } from './dtos/start-interview.dto';
import { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { UserDto } from './../common/modules/user/user.dto';
import { AuthUser } from './../../decorators/auth.decorator';
import { Controller, Get, HttpCode, HttpStatus, Post, Res, Body, Param, UseInterceptors, UploadedFile, UseGuards, Query, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { Response } from 'express';
import { Auth } from '../../decorators/http.decorator';
import { Role } from '../../constants/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiFile } from '../../decorators/swagger.decorator';
import { FileSizeGuard } from '../../guards/file-size.guard';
import { IsInterviewFinishedEarlierDto } from './dtos/is-interview-finished-earlier.dto';

@Controller('meetings')
@ApiTags('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) { }

  @Auth([ Role.CANDIDATE ])
  @Get('intro-message')
  @HttpCode(HttpStatus.OK)
  async getMeetingIntroMessage(
    @AuthUser() user: UserDto,
    @Res() res: Response,
  ): Promise<Response> {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');

    return res.send(await this.meetingService.readInitialMeetingTextByPolly(user));
  }

  @Get('/interview/by-link/:meetingPostfix')
  async getMeetingByMeetingUrl(
    @Param('meetingPostfix') meetingPostfix: string
  ) {
    return this.meetingService.getMeetingByMeetingLink(meetingPostfix)
  }
  

  @Post('/schedule')
  @HttpCode(HttpStatus.OK)
  async scheduleInterview(
    @Body() scheduleInterviewDto: ScheduleInterviewDto
  ) {
    return this.meetingService.scheduleInterview(scheduleInterviewDto)
  }

  // tmp solution
  // @AuthWithoutRequiredUser()
  @Post('/schedule/:id/start')
  @HttpCode(HttpStatus.OK)
  async startInterview(
    @Param('id') id: string,
    @Body() startInterviewDto: StartInterviewDto
    // @AuthUser() user: Candidate
  ) {
    // tmp solution
    // return this.meetingService.startInterview(id, user)
    return this.meetingService.startInterview(id, startInterviewDto)
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
    @Query() IsInterviewFinishedEarlierDto: IsInterviewFinishedEarlierDto,
    // @UploadedFile() file: Express.Multer.File
  ) {
    return this.meetingService.finishInterview(scheduleId, IsInterviewFinishedEarlierDto);
  }

  @Get('/schedule/:scheduleId')
  @HttpCode(HttpStatus.OK)
  async getInterviewById(
    @Param('scheduleId') scheduleId: string
  ) {
    return this.meetingService.getInterviewByScheduleId(scheduleId);
  }

  @Post('/schedule/:scheduleId/invite')
  @HttpCode(HttpStatus.OK)
  async sendInvitationToCandidate(
    @Param('scheduleId') scheduleId: string
  ) {
    return this.meetingService.sendInvitionToCandidate(scheduleId)
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
    return this.meetingService.saveRecordingForQuestionByMeeting(file, scheduleId, questionId)

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
      return this.meetingService.saveCheatingForQuestionByMeeting(scheduleId, questionId)

    }
}
