import { EvaluationRepository } from './../../repositories/EvaluationRepository';
import { ApiConfigService } from './../../shared/services/api-config.service';
import { MailService } from './../../shared/services/mail.service';
import { S3Service } from './../../shared/services/aws-s3.service';
import { ScheduleRepository } from './../../repositories/ScheduleRepository';
import { UtilsProvider } from './../../providers/utils.provider';
import { CandidateRepository } from './../../repositories/CandidateRepository';
import { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { UserDto } from './../common/modules/user/user.dto';
import { PollyService } from '../../shared/services/aws-polly.service';
import { Injectable } from '@nestjs/common';
import { QuestionService } from '../question/question.service';

@Injectable()
export class MeetingService {
  constructor(
    private readonly pollyService: PollyService,
    private readonly s3Service: S3Service,
    private readonly configService: ApiConfigService,
    private readonly candidateRepository: CandidateRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly mailService: MailService,
    private readonly questionService: QuestionService
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
    const fullPath = `${this.configService.frontendUrl}/meeting/${uniqueIdOfMeeting}`
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

    const evaluationEntity = await this.evaluationRepository.save(this.evaluationRepository.create({
      questionId,
      interviewId: 20,
      asrfilename: fileName,
      asrfileS3key: link,
    }));


    return evaluationEntity;
  }

  async sendInvitionToCandidate(interviewId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(interviewId);
    
    await this.mailService.send({
      to: scheduleEntity.candidate.email,
      subject: "You're Invited! Join Your Meeting on Canint",
      html: this.mailService.sendInvitationForAMeeting(scheduleEntity.candidate.firstName, scheduleEntity.candidate.email, scheduleEntity.meetingLink),
    });  
  }

  async  getMeetingByMeetingLink(meetingPostfix: string) {
    const scheduleEntity = await this.scheduleRepository.findByMeetingLink(`${this.configService.frontendUrl}/meeting/${meetingPostfix}`);

    console.log(scheduleEntity);
    return scheduleEntity;
  }

  async getInterviewByScheduleId(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);

    const candidateSkills = scheduleEntity.candidate.candidateSkills;

    const questionsBySkill = await this.questionService.getQuestionsBySkill(candidateSkills[0].skillId)

    return questionsBySkill.toDtos();
  }
}
