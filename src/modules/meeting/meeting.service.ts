import { ScheduleRepository } from './../../repositories/ScheduleRepository';
import { UtilsProvider } from './../../providers/utils.provider';
import { CandidateService } from './../candidate/candidate.service';
import { CandidateRepository } from './../../repositories/CandidateRepository';
import { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { UserDto } from './../common/modules/user/user.dto';
import { PollyService } from '../../shared/services/aws-polly.service';
import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class MeetingService {
  constructor(
    private readonly pollyService: PollyService,
    private readonly candidateService: CandidateService,
    private scheduleRepository: ScheduleRepository
  ) {}


  async readInitialMeetingTextByPolly(user: UserDto) {
    const text = `Hello ${user.firstName}, I’m Bryan, the interviewer for today. I’ll be guiding you through this interview process. Before we start, I’d like to make sure everything is ready for the interview. Please take a moment to check your camera and microphone. Once you're ready, we’ll proceed with the next steps.`
    return this.pollyService.generateSpeechStream(text);
  }

  async scheduleInterview(scheduleInterviewDto: ScheduleInterviewDto) {
    const candidateEntity = await this.candidateService.getEntityById(scheduleInterviewDto.candidateId);
    
    const uniqueIdOfMeeting = UtilsProvider.generateUniqueIdOfMeeting()
    const fullPath = `http://localhost:3001/meeting/${uniqueIdOfMeeting}`
    const scheduleEntity = await this.scheduleRepository.save(this.scheduleRepository.create({
      scheduledDatetime: scheduleInterviewDto.scheduledDateTime,
      candidate: candidateEntity,
      meetingLink: fullPath
    }));

    return scheduleEntity;
  }

}
