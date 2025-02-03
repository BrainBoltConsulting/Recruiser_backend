import { S3Service } from './../../shared/services/aws-s3.service';
import { ScheduleRepository } from './../../repositories/ScheduleRepository';
import { UtilsProvider } from './../../providers/utils.provider';
import { CandidateRepository } from './../../repositories/CandidateRepository';
import { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { UserDto } from './../common/modules/user/user.dto';
import { PollyService } from '../../shared/services/aws-polly.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MeetingService {
  constructor(
    private readonly pollyService: PollyService,
    private readonly s3Service: S3Service,
    private readonly candidateRepository: CandidateRepository,
    private readonly scheduleRepository: ScheduleRepository
  ) {}


  async readInitialMeetingTextByPolly(user: UserDto) {
    const text = `Hello ${user.firstName}, I’m Bryan, the interviewer for today. I’ll be guiding you through this interview process. Before we start, I’d like to make sure everything is ready for the interview. Please take a moment to check your camera and microphone. Once you're ready, we’ll proceed with the next steps.`
    return this.pollyService.generateSpeechStream(text);
  }

  async getInterviewsOfCandidate(candidateId: number) {
    const interviewsOfCandidate = await this.scheduleRepository.findByCandidateId(candidateId);

    return interviewsOfCandidate;
  }

  async scheduleInterview(scheduleInterviewDto: ScheduleInterviewDto) {
    const candidateEntity = await this.candidateRepository.findById(scheduleInterviewDto.candidateId);
    
    const uniqueIdOfMeeting = UtilsProvider.generateUniqueIdOfMeeting()
    const fullPath = `http://localhost:3001/meeting/${uniqueIdOfMeeting}`
    const scheduleEntity = await this.scheduleRepository.save(this.scheduleRepository.create({
      scheduledDatetime: scheduleInterviewDto.scheduledDateTime,
      candidate: candidateEntity,
      meetingLink: fullPath
    }));

    return scheduleEntity;
  }

  async finishInterview(file: Express.Multer.File) {
    const response = await this.s3Service.uploadFile(file, 'VideoInterviewFiles');
    const link = response.Location;

    return link;
  }

  async saveRecordingForQuestionByMeeting(file: Express.Multer.File, interviewId: string, questionId: string) {
    const fileName = `MId-${interviewId}-QId-${questionId}-${Date.now()}`
    const response = await this.s3Service.uploadFile(file, 'VideoInterviewFiles', fileName);
    const link = response.Location;

    return link;
  }
}
