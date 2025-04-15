import { ConfigRepository } from './../../repositories/ConfigRepository';
import { Candidate } from './../../entities/Candidate';
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
import { Injectable, BadRequestException } from '@nestjs/common';
import { QuestionService } from '../question/question.service';
import { InterviewRepository } from '../../repositories/InterviewRepository';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class MeetingService {
  constructor(
    private readonly pollyService: PollyService,
    private readonly s3Service: S3Service,
    private readonly configService: ApiConfigService,
    private readonly candidateRepository: CandidateRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly configRepository: ConfigRepository,
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
      scheduledDatetime: new Date(),
      candidate: candidateEntity,
      meetingLink: fullPath
    }));

    return scheduleEntity;
  }

  @Transactional()
  async startInterview(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const interviewEntityByCandidateId = await this.interviewRepository.findByCandidateId(scheduleEntity.candidateId);

    console.log(interviewEntityByCandidateId)
   
    if (interviewEntityByCandidateId && scheduleEntity.attendedDatetime) {
      throw new BadRequestException('Interview has already happened, can not move forward')
    };

    const interviewDate = new Date();

    const interviewEntity = await this.interviewRepository.save(this.interviewRepository.create({
      interviewDate,
      candidateId: scheduleEntity.candidateId,
    })); 

    await this.scheduleRepository.update(scheduleId, { attendedDatetime: interviewDate });

    return interviewEntity;
  }

  async finishInterview(file: Express.Multer.File) {
    const response = await this.s3Service.uploadFile(file, 'VideoInterviewFiles');
    const link = response.Location;

    return link;
  }

  async saveRecordingForQuestionByMeeting(file: Express.Multer.File, scheduleId: string, questionId: string, candidate: Candidate) {
    const fileName = `SId-${scheduleId}-QId-${questionId}-CId-${candidate.candidateId}-${Date.now()}`
    const responseFromS3 = await this.s3Service.uploadFile(file, 'VideoInterviewFiles', fileName);
    const s3Uri = UtilsProvider.createS3UriFromS3BucketAndKey(responseFromS3.Bucket, responseFromS3.Key);
    const interviewEntityByCandidateId = await this.interviewRepository.findByCandidateId(candidate.candidateId); // tmp solution
    
    const evaluationEntity = await this.evaluationRepository.save(this.evaluationRepository.create({
      questionId,
      interviewId: interviewEntityByCandidateId?.interviewId || 20,  // tmp solution
      videofileS3key: s3Uri,
    }));

    return evaluationEntity;
  }

  async sendInvitionToCandidate(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    
    await this.mailService.send({
      to: scheduleEntity.candidate.email,
      subject: "You're Invited! Join Your Meeting on Canint",
      html: this.mailService.sendInvitationForAMeeting(scheduleEntity.candidate.firstName, scheduleEntity.candidate.email, scheduleEntity.meetingLink),
    });  
  }

  async getMeetingByMeetingLink(meetingPostfix: string) {
    const scheduleEntity = await this.scheduleRepository.findByMeetingLink(`${this.configService.frontendUrl}/meeting/${meetingPostfix}`);

    return scheduleEntity;
  }

  async getInterviewByScheduleId(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const candidateSkills = scheduleEntity.candidate.candidateSkills;
    const getQuestionsAmountEntity = await this.configRepository.getQuestionsbySkillSequence(1);
    const questionsBySkill = await this.questionService.getQuestionsBySkill(candidateSkills[0].skillId, getQuestionsAmountEntity.configValue)

    return questionsBySkill.toDtos();
  }
}
