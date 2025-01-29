import { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { AuthWithoutRequiredUserGuard } from './../../guards/auth-without-required-user.guard';
import { UserDto } from './../common/modules/user/user.dto';
import { AuthUser } from './../../decorators/auth.decorator';
import { Questions } from '../../entities/Questions';
import { Controller, Get, HttpCode, HttpStatus, Post, Query, Res, Body, Delete, Param, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { Response } from 'express';
import { Auth } from '../../decorators/http.decorator';
import { Role } from '../../constants/role.enum';


@Controller('meeting')
@ApiTags('meeting')
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

  @Post('/interview/schedule')
  @HttpCode(HttpStatus.OK)
  async scheduleInterview(
    @Body() scheduleInterviewDto: ScheduleInterviewDto
  ) {
    console.log(scheduleInterviewDto)
    return this.meetingService.scheduleInterview(scheduleInterviewDto)
  }

  @Post('/interview/:id/start')
  @HttpCode(HttpStatus.OK)
  async startInterview(
    @Param('id') id: string, 
    @Body() scheduleInterviewDto: ScheduleInterviewDto
  ) {
    console.log(scheduleInterviewDto)
    return this.meetingService.scheduleInterview(scheduleInterviewDto)
  }
}
