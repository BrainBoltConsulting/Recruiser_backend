import { JobsRepository } from './../../repositories/JobsRepository';
import { DishonestRepository } from './../../repositories/DishonestRepository';
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
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { QuestionService } from '../question/question.service';
import { InterviewRepository } from '../../repositories/InterviewRepository';
import { Transactional } from 'typeorm-transactional';
import { MessageTypeEnum } from '../../constants/message.enum';

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
    private readonly jobsRepository: JobsRepository,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly dishonestRepository: DishonestRepository,
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
    const jobEntity = await this.jobsRepository.findById(scheduleInterviewDto.jobId);

    const findScheduleEntityWithTheSameCandidateAndJob = await this.scheduleRepository.findByCandidateAndJobId(scheduleInterviewDto.candidateId, scheduleInterviewDto.jobId);

    if (findScheduleEntityWithTheSameCandidateAndJob) {
      throw new BadRequestException('By candidate id and job id meeting already exists')
    }

    const scheduleEntity = await this.scheduleRepository.save(this.scheduleRepository.create({
      scheduledDatetime: new Date(),
      candidate: candidateEntity,
      jobId: scheduleInterviewDto.jobId,
      job: jobEntity
    }));

    return scheduleEntity;
  }



  @Transactional()
  async startInterview(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const interviewEntityByCandidateId = await this.interviewRepository.findByCandidateId(scheduleEntity.candidateId);
  
    console.log(interviewEntityByCandidateId);
  
    if (interviewEntityByCandidateId && scheduleEntity.attendedDatetime) {
      throw new BadRequestException('Interview has already happened, can not move forward');
    }
  
    const now = new Date();
    const scheduledDate = new Date(scheduleEntity.scheduledDatetime);
    const meetingLinkExpiryConfig = await this.configRepository.getMeetingLinkExpiryValue();

    if (!meetingLinkExpiryConfig) {
      throw new BadRequestException('Meeting link expiry config is not found')
    }

    const hoursDifference = (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);
    if (hoursDifference > Number(meetingLinkExpiryConfig.configValue)) {
      throw new BadRequestException(`Scheduled time has already passed by more than ${Number(meetingLinkExpiryConfig.configValue)} hours`);
    }
  
    const interviewEntity = await this.interviewRepository.save(
      this.interviewRepository.create({
        interviewDate: now,
        candidateId: scheduleEntity.candidateId,
      })
    );
  
    await this.scheduleRepository.update(scheduleId, { attendedDatetime: now });
  
    return interviewEntity;
  }
  

  async finishInterview(file: Express.Multer.File) {
    const response = await this.s3Service.uploadFile(file, 'VideoInterviewFiles');
    const link = response.Location;

    return link;
  }

  async saveRecordingForQuestionByMeeting(file: Express.Multer.File, scheduleId: string, questionId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const candidate = scheduleEntity.candidate;

    const fileName = `SId-${scheduleId}-QId-${questionId}-CId-${candidate.candidateId}-${Date.now()}`
    const responseFromS3 = await this.s3Service.uploadFile(file, 'VideoInterviewFiles', fileName);
    const s3Uri = UtilsProvider.createS3UriFromS3BucketAndKey(responseFromS3.Bucket, responseFromS3.Key);
    const interviewEntityByCandidateId = await this.interviewRepository.findByCandidateId(candidate.candidateId); // tmp solution
    
    const evaluationEntity = await this.evaluationRepository.save(this.evaluationRepository.create({
      questionId,
      interviewId: interviewEntityByCandidateId?.interviewId,  // tmp solution
      videofileS3key: s3Uri,
    }));

    return evaluationEntity;
  }

  @Transactional()
  async saveCheatingForQuestionByMeeting(scheduleId: string, questionId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const candidate = scheduleEntity.candidate;
    const interviewEntityByCandidateId = await this.interviewRepository.findByCandidateId(candidate.candidateId); // tmp solution
    const findDishonestEntityByQUestionAndInterviewId = await this.dishonestRepository.findByInterviewIdAndQuestionId(interviewEntityByCandidateId.interviewId, questionId);
    const switchCount = (Number(findDishonestEntityByQUestionAndInterviewId?.switchCount) || 0) + 1;

    if (!findDishonestEntityByQUestionAndInterviewId) {
      await this.dishonestRepository.save(this.dishonestRepository.create({
        interview: interviewEntityByCandidateId,
        interviewId: interviewEntityByCandidateId.interviewId,
        questionId,
        switchCount
      }));

    } else {
      await this.dishonestRepository.save({...findDishonestEntityByQUestionAndInterviewId, switchCount})
    }

    return UtilsProvider.getMessageOverviewByType(MessageTypeEnum.TAB_SWITCH);
  }

  @Transactional()
  async sendInvitionToCandidate(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const newMeetingLink = this.generateNewMeetingLink();

    await this.scheduleRepository.update(scheduleEntity.scheduleId, { meetingLink: newMeetingLink, scheduledDatetime: new Date() });
    await this.mailService.send({
      to: scheduleEntity.candidate.email,
      subject: "You're Invited! Join Your Meeting on Canint",
      html: this.mailService.sendInvitationForAMeeting(scheduleEntity.candidate.firstName, scheduleEntity.candidate.email, newMeetingLink),
    }); 
  }

  async getMeetingByMeetingLink(meetingPostfix: string) {
    const meetingLink = `${this.configService.frontendUrl}/meeting/${meetingPostfix}`;
    const scheduleEntity = await this.scheduleRepository.findByMeetingLink(meetingLink);

    if (!scheduleEntity) {
      throw new NotFoundException(`Schedule entity does not found by this link: ${meetingLink}`)
    }

    const now = new Date();
    const scheduledDate = new Date(scheduleEntity.scheduledDatetime);
    const meetingLinkExpiryConfig = await this.configRepository.getMeetingLinkExpiryValue();

    if (!meetingLinkExpiryConfig) {
      throw new BadRequestException('Meeting link expiry config is not found')
    }

    const hoursDifference = (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);
    if (hoursDifference > Number(meetingLinkExpiryConfig.configValue)) {
      throw new BadRequestException(`Scheduled time has already passed by more than ${Number(meetingLinkExpiryConfig.configValue)} hours`);
    }

    return scheduleEntity;
  }

  async getInterviewByScheduleId(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const jobSkills = scheduleEntity.job.jobSkills;
    const jobSkillsSorted = jobSkills.sort((jobSkill1, jobSkill2) => Number(jobSkill1.skillSequence) - Number(jobSkill2.skillSequence))
    const getQuestionsConfigAmountBySkillSequence = await this.configRepository.getQuestionsbySkillSequences();

    if (!getQuestionsConfigAmountBySkillSequence || !getQuestionsConfigAmountBySkillSequence.length) {
      throw new BadRequestException();
    }

    const questionsConfigsAmountBySkillSequenceSorted = getQuestionsConfigAmountBySkillSequence.sort((config1, config2) => config1.configName.localeCompare(config2.configName));
    const questionConfigsAmountByCandidateSkillsAmount = questionsConfigsAmountBySkillSequenceSorted.slice(0, jobSkillsSorted.length);
    const difficultyLevelByPercentage = await this.configRepository.getQuestionsDifficultyLevelByPercentage();

    if (!difficultyLevelByPercentage || !difficultyLevelByPercentage.length) {
      throw new BadRequestException();
    }

    const difficultyLevelNumbersByPercentageSorted = difficultyLevelByPercentage.sort((config1, config2) => config1.configName.localeCompare(config2.configName)).map((config) => Number(config.configValue));
    const skillAndQuestionsByCount = questionConfigsAmountByCandidateSkillsAmount.map((questionConfig, index) => ({ skillId: jobSkillsSorted[index].skillId, count: Number(questionConfig.configValue) }))


    const questonsList = await this.questionService.getQuestionsByDifficultyLevelAndSkills(
      skillAndQuestionsByCount,
      difficultyLevelNumbersByPercentageSorted
    );
    const questionsListOrdered = this.questionService.sortQuestionsBySkillAndLevel(questonsList, jobSkillsSorted.map((jobSkill) => Number(jobSkill.skillId)));

    return questionsListOrdered.toDtos();
  }

  generateNewMeetingLink() {
    const uniqueIdOfMeeting = UtilsProvider.generateUniqueIdOfMeeting();
    const fullPath = `${this.configService.frontendUrl}/meeting/${uniqueIdOfMeeting}`;

    return fullPath;
  }
}
