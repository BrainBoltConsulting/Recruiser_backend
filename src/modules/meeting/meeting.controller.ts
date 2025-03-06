import { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { AuthWithoutRequiredUserGuard } from './../../guards/auth-without-required-user.guard';
import { UserDto } from './../common/modules/user/user.dto';
import { AuthUser } from './../../decorators/auth.decorator';
import { Questions } from '../../entities/Questions';
import { Controller, Get, HttpCode, HttpStatus, Post, Query, Res, Body, Delete, Param, Header, UseInterceptors, UploadedFile, UseGuards, Options } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { Response } from 'express';
import { Auth, AuthWithoutRequiredUser } from '../../decorators/http.decorator';
import { Role } from '../../constants/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiFile } from '../../decorators/swagger.decorator';
import { FileSizeGuard } from '../../guards/file-size.guard';
import { Candidate } from '../../entities/Candidate';


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

  @Post('/interview/schedule')
  @HttpCode(HttpStatus.OK)
  async scheduleInterview(
    @Body() scheduleInterviewDto: ScheduleInterviewDto
  ) {
    return this.meetingService.scheduleInterview(scheduleInterviewDto)
  }

  @Post('/interview/:id/start')
  @HttpCode(HttpStatus.OK)
  async startInterview(
    @Param('id') id: string, 
    @Body() scheduleInterviewDto: ScheduleInterviewDto
  ) {
    return this.meetingService.scheduleInterview(scheduleInterviewDto)
  }

  @Post('/interview/:id/finish')
  @UseInterceptors(FileInterceptor('videoFile'))
  @UseGuards(new FileSizeGuard(10 * 1024 * 1024))
  @ApiFile([{ name: 'videoFile' }], {
    okResponseData: {
      description: 'finish-interview',
    },
  })
  @HttpCode(HttpStatus.OK)
  async finishInterview(
    @Param('id') id: string, 
    @UploadedFile() file: Express.Multer.File
  ) {
    console.log(file)
    return this.meetingService.finishInterview(file)
  }

  @Get('/interview/:scheduleId')
  @HttpCode(HttpStatus.OK)
  async getInterviewById(
    @Param('scheduleId') scheduleId: string
  ) {
    return this.meetingService.getInterviewByScheduleId(scheduleId);
  }

  @Post('/interview/:interviewId/invite')
  @HttpCode(HttpStatus.OK)
  async sendInvitationToCandidate(
    @Param('interviewId') interviewId: string
  ) {
    return this.meetingService.sendInvitionToCandidate(interviewId)
  }

  // tmp solution
  @AuthWithoutRequiredUser()
  @Post('/interview/:interviewId/questions/:questionId/recording')
  @UseInterceptors(FileInterceptor('videoFile'))
  @UseGuards(new FileSizeGuard(10 * 1024 * 1024))
  @ApiFile([{ name: 'videoFile' }], {
    okResponseData: {
      description: 'finish-interview',
    },
  })
  @HttpCode(HttpStatus.OK)
  async saveRecordingForQuestionByMeeting(
    @Param('interviewId') interviewId: string, 
    @Param('questionId') questionId: string, 
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() user: Candidate
  ) {
    return this.meetingService.saveRecordingForQuestionByMeeting(file, interviewId, questionId, user)
  }

  @Options('/interview/:interviewId/questions/:questionId/recording')
  handleOptions() {
    return {
      'Access-Control-Allow-Origin': 'https://hire2o.net',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    };
  }
}
