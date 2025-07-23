import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import { MessageTypeEnum } from '../../constants/message.enum';
import type { Interview } from '../../entities/Interview';
import { UtilsProvider } from '../../providers/utils.provider';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { ConfigRepository } from '../../repositories/ConfigRepository';
import { DishonestRepository } from '../../repositories/DishonestRepository';
import { EvaluationRepository } from '../../repositories/EvaluationRepository';
import { InterviewRepository } from '../../repositories/InterviewRepository';
import { JobsRepository } from '../../repositories/JobsRepository';
import { ScheduleRepository } from '../../repositories/ScheduleRepository';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { PollyService } from '../../shared/services/aws-polly.service';
import { S3Service } from '../../shared/services/aws-s3.service';
import { MailService } from '../../shared/services/mail.service';
import { SlackNotificationService } from '../../shared/services/slack-notification.service';
import { QuestionService } from '../question/question.service';
import { IsInterviewFinishedEarlierDto } from './dtos/is-interview-finished-earlier.dto';
import type { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { StartInterviewDto } from './dtos/start-interview.dto';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    private readonly pollyService: PollyService,
    private readonly s3Service: S3Service,
    private readonly slackNotificationService: SlackNotificationService,
    private readonly configService: ApiConfigService,
    private readonly candidateRepository: CandidateRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly configRepository: ConfigRepository,
    private readonly jobsRepository: JobsRepository,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly dishonestRepository: DishonestRepository,
    private readonly mailService: MailService,
    private readonly questionService: QuestionService,
  ) {}

  async getInterviewsOfCandidate(candidateId: number) {
    const interviewsOfCandidate =
      await this.interviewRepository.findByCandidateIdExtended(candidateId);

    return interviewsOfCandidate;
  }

  async scheduleInterview(scheduleInterviewDto: ScheduleInterviewDto) {
    this.logger.log(
      `Scheduling interview for candidateId=${scheduleInterviewDto.candidateId}, jobId=${scheduleInterviewDto.jobId}`,
    );

    const candidateEntity = await this.candidateRepository.findById(
      scheduleInterviewDto.candidateId,
    );
    this.logger.log(
      `Fetched Candidate: ${candidateEntity.firstName} ${candidateEntity.lastName} (ID: ${candidateEntity.candidateId})`,
    );

    const jobEntity = await this.jobsRepository.findById(
      scheduleInterviewDto.jobId,
    );
    this.logger.log(
      `Fetched Candidate: ${candidateEntity.firstName} ${candidateEntity.lastName} (ID: ${candidateEntity.candidateId})`,
    );

    const findScheduleEntityWithTheSameCandidateAndJob =
      await this.scheduleRepository.findByCandidateAndJobId(
        scheduleInterviewDto.candidateId,
        scheduleInterviewDto.jobId,
      );

    if (findScheduleEntityWithTheSameCandidateAndJob) {
      this.logger.warn(
        `Attempt to schedule duplicate interview for candidateId=${scheduleInterviewDto.candidateId}, jobId=${scheduleInterviewDto.jobId}`,
      );

      throw new BadRequestException(
        'By candidate id and job id meeting already exists',
      );
    }

    const newSchedule = this.scheduleRepository.create({
      scheduledDatetime: new Date(),
      candidate: candidateEntity,
      candidateId: candidateEntity.candidateId,
      jobId: scheduleInterviewDto.jobId,
      job: jobEntity,
    });

    const scheduleEntity = await this.scheduleRepository.save(newSchedule);
    this.logger.log(
      `Interview scheduled successfully | scheduleId=${scheduleEntity.scheduleId}, ` +
        `candidateId=${scheduleEntity.candidateId}, jobId=${scheduleEntity.jobId}`,
    );

    await this.sendInvitionToCandidate(scheduleEntity.scheduleId);

    this.logger.log(
      `Invitation sent to candidate ${scheduleEntity.candidate.firstName} ${scheduleEntity.candidate.lastName}`,
    );

    return scheduleEntity;
  }

  @Transactional()
  async startInterview(
    scheduleId: string,
    startInterviewDto: StartInterviewDto,
  ) {
    this.logger.log(
      `Attempting to start interview for scheduleId=${scheduleId}`,
    );

    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const interviewEntityByCandidateId =
      await this.interviewRepository.findByCandidateIdExtended(
        scheduleEntity.candidateId,
      );

    if (interviewEntityByCandidateId || scheduleEntity.attendedDatetime) {
      this.logger.warn(
        `Interview already started or attended for candidateId=${scheduleEntity.candidateId}`,
      );

      throw new BadRequestException(
        'Interview has already happened, can not move forward',
      );
    }

    const now = new Date();
    const scheduledDate = new Date(scheduleEntity.scheduledDatetime);
    const meetingLinkExpiryConfig =
      await this.configRepository.getMeetingLinkExpiryValue();

    if (!meetingLinkExpiryConfig) {
      throw new BadRequestException('Meeting link expiry config is not found');
    }

    const hoursDifference =
      (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);

    if (hoursDifference > Number(meetingLinkExpiryConfig.configValue)) {
      throw new BadRequestException(
        `Scheduled time has already passed by more than ${Number(
          meetingLinkExpiryConfig.configValue,
        )} hours`,
      );
    }

    const interviewEntity = await this.interviewRepository.save(
      this.interviewRepository.create({
        interviewDate: now,
        candidateId: scheduleEntity.candidateId,
        browserName: startInterviewDto.browserName,
      }),
    );

    await this.scheduleRepository.update(scheduleId, { attendedDatetime: now });


    const { uploadId, s3Key } = await this.initiateMultipartUpload(scheduleId);
    // const interviewDetails = {
    //   scheduleId: scheduleId,
    //   candidateId: scheduleEntity.candidateId,
    //   interviewId: interviewEntity.interviewId
    // }
    // this.cloudWatchLoggerService.logFromBackend('Interview is going to start...', interviewDetails)
    this.logger.log(
      `Interview started successfully for candidateId=${scheduleEntity.candidateId}, interviewId=${interviewEntity.interviewId}`,
    );

    return { ...interviewEntity, uploadId, s3Key };
  }

  @Transactional()
  async finishInterview(
    scheduleId: string,
    isInterviewFinishedEarlierDto: IsInterviewFinishedEarlierDto,
  ) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const candidate = scheduleEntity.candidate;
    const interviewEntityByCandidateId =
      await this.interviewRepository.findByCandidateIdExtended(
        candidate.candidateId,
      );
    const interviewEntityUpdate: Partial<Interview> = {};

    if (isInterviewFinishedEarlierDto.isInterviewFinishedEarlier) {
      interviewEntityUpdate.isInterviewFinishedEarlier = true;
    }

    // const interviewUploads3Response = await this.s3Service.uploadFile(file, 'Complete_Interview');
    // const s3Uri = UtilsProvider.createS3UriFromS3BucketAndKey(interviewUploads3Response.Bucket, interviewUploads3Response.Key);

    // interviewEntityUpdate.videofileS3key = s3Uri;

    if (Object.values(interviewEntityUpdate).length > 0) {
      await this.interviewRepository.update(
        interviewEntityByCandidateId.interviewId,
        interviewEntityUpdate,
      );
    }

    await this.slackNotificationService.sendBlocks({
      blocks: this.slackNotificationService.formatInterviewSlackPayload({
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        scheduleId: scheduleEntity.scheduleId,
        jobId: scheduleEntity.jobId,
        candidate: {
          id: candidate.candidateId.toString(),
          fullName: candidate.firstName + ' ' + candidate.lastName,
        },
        browser: interviewEntityByCandidateId.browserName,
        attendedTime: scheduleEntity.attendedDatetime,
        finishedEarly: interviewEntityUpdate.isInterviewFinishedEarlier,
        evaluations: interviewEntityByCandidateId.evaluations,
        dishonests: interviewEntityByCandidateId.dishonests,
      }),
    });

    return UtilsProvider.getMessageOverviewByType(
      MessageTypeEnum.INTERVIEW_FINISHED,
    );
  }

  async saveRecordingForQuestionByMeeting(
    file: Express.Multer.File,
    scheduleId: string,
    questionId: string,
  ) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const candidate = scheduleEntity.candidate;

    const fileName = `SId-${scheduleId}-QId-${questionId}-CId-${
      candidate.candidateId
    }-${Date.now()}`;
    const responseFromS3 = await this.s3Service.uploadFile(
      file,
      'VideoInterviewFiles',
      fileName,
    );
    const s3Uri = UtilsProvider.createS3UriFromS3BucketAndKey(
      responseFromS3.Bucket,
      responseFromS3.Key,
    );
    const interviewEntityByCandidateId =
      await this.interviewRepository.findByCandidateId(candidate.candidateId); // tmp solution

    const evaluationEntity = await this.evaluationRepository.save(
      this.evaluationRepository.create({
        questionId,
        interviewId: interviewEntityByCandidateId?.interviewId, // tmp solution
        videofileS3key: s3Uri,
      }),
    );

    return evaluationEntity;
  }

  @Transactional()
  async saveCheatingForQuestionByMeeting(
    scheduleId: string,
    questionId: string,
  ) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const candidate = scheduleEntity.candidate;
    const interviewEntityByCandidateId =
      await this.interviewRepository.findByCandidateId(candidate.candidateId); // tmp solution
    const findDishonestEntityByQUestionAndInterviewId =
      await this.dishonestRepository.findByInterviewIdAndQuestionId(
        interviewEntityByCandidateId.interviewId,
        questionId,
      );
    const switchCount =
      (Number(findDishonestEntityByQUestionAndInterviewId?.switchCount) || 0) +
      1;

    await (!findDishonestEntityByQUestionAndInterviewId
      ? this.dishonestRepository.save(
          this.dishonestRepository.create({
            interview: interviewEntityByCandidateId,
            interviewId: interviewEntityByCandidateId.interviewId,
            questionId,
            switchCount,
          }),
        )
      : this.dishonestRepository.save({
          ...findDishonestEntityByQUestionAndInterviewId,
          switchCount,
        }));

    return UtilsProvider.getMessageOverviewByType(MessageTypeEnum.TAB_SWITCH);
  }

  @Transactional()
  async sendInvitionToCandidate(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const newMeetingLink = this.generateNewMeetingLink();
    const jobTitle = scheduleEntity.job.jobTitle || '';

    await this.scheduleRepository.update(scheduleEntity.scheduleId, {
      meetingLink: newMeetingLink,
      scheduledDatetime: new Date(),
    });
    await this.mailService.send({
      to: scheduleEntity.candidate.email,
      subject: `You're Invited! Join Your Meeting on ${scheduleEntity.job.manager.company || 'Hire2o'}`,
      bcc: [ scheduleEntity.job.manager.managerEmail ],
      html: this.mailService.sendInvitationForAMeeting(
        scheduleEntity.candidate.firstName,
        scheduleEntity.job.manager,
        jobTitle,
        newMeetingLink,
      ),
    });
  }

  async getMeetingByMeetingLink(meetingPostfix: string) {
    const meetingLink = `${this.configService.frontendUrl}/meeting/${meetingPostfix}`;
    const scheduleEntity = await this.scheduleRepository.findByMeetingLink(
      meetingLink,
    );

    if (!scheduleEntity) {
      throw new NotFoundException(
        `Schedule entity does not found by this link: ${meetingLink}`,
      );
    }

    const now = new Date();
    const scheduledDate = new Date(scheduleEntity.scheduledDatetime);
    const meetingLinkExpiryConfig =
      await this.configRepository.getMeetingLinkExpiryValue();

    if (!meetingLinkExpiryConfig) {
      throw new BadRequestException('Meeting link expiry config is not found');
    }

    const hoursDifference =
      (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);

    if (hoursDifference > Number(meetingLinkExpiryConfig.configValue)) {
      throw new BadRequestException(
        `Scheduled time has already passed by more than ${Number(
          meetingLinkExpiryConfig.configValue,
        )} hours`,
      );
    }

    return scheduleEntity;
  }

  async getInterviewByScheduleId(scheduleId: string) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    const jobSkills = scheduleEntity.job.jobSkills;
    const jobSkillsSorted = jobSkills.sort(
      (jobSkill1, jobSkill2) =>
        Number(jobSkill1.skillSequence) - Number(jobSkill2.skillSequence),
    );
    const getQuestionsConfigAmountBySkillSequence =
      await this.configRepository.getQuestionsbySkillSequences();

    if (
      !getQuestionsConfigAmountBySkillSequence ||
      getQuestionsConfigAmountBySkillSequence.length === 0
    ) {
      throw new BadRequestException();
    }

    const questionsConfigsAmountBySkillSequenceSorted =
      getQuestionsConfigAmountBySkillSequence.sort((config1, config2) =>
        config1.configName.localeCompare(config2.configName),
      );
    const questionConfigsAmountByCandidateSkillsAmount =
      questionsConfigsAmountBySkillSequenceSorted.slice(
        0,
        jobSkillsSorted.length,
      );
    const difficultyLevelByPercentage =
      await this.configRepository.getQuestionsDifficultyLevelByPercentage();

    if (
      !difficultyLevelByPercentage ||
      difficultyLevelByPercentage.length === 0
    ) {
      throw new BadRequestException();
    }

    const difficultyLevelNumbersByPercentageSorted = difficultyLevelByPercentage
      .sort((config1, config2) =>
        config1.configName.localeCompare(config2.configName),
      )
      .map((config) => Number(config.configValue));
    const skillAndQuestionsByCount =
      questionConfigsAmountByCandidateSkillsAmount.map(
        (questionConfig, index) => ({
          skillId: jobSkillsSorted[index].skillId,
          count: Number(questionConfig.configValue),
        }),
      );

    const questonsList =
      await this.questionService.getQuestionsByDifficultyLevelAndSkills(
        skillAndQuestionsByCount,
        difficultyLevelNumbersByPercentageSorted,
      );
    const questionsListOrdered =
      this.questionService.sortQuestionsBySkillAndLevel(
        questonsList,
        jobSkillsSorted.map((jobSkill) => Number(jobSkill.skillId)),
      );

    return questionsListOrdered.toDtos();
  }

  async initiateMultipartUpload(scheduleId: string) {
    const s3Key = `Complete_Interview/${scheduleId}/interview_${Date.now()}.webm`;
    const res = await this.s3Service.createMultipartUpload(s3Key);
    return { uploadId: res.UploadId, s3Key };
  }
  
  async uploadMultipartChunk(
    scheduleId: string,
    s3Key: string,
    chunk: Express.Multer.File,
    uploadId: string,
    partNumber: number
  ) {
    const res = await this.s3Service.uploadPart(
      s3Key,
      uploadId,
      partNumber,
      chunk.buffer
    );
    return { ETag: res.ETag, PartNumber: partNumber };
  }
  
  async completeMultipartUpload(
    scheduleId: string,
    s3Key: string,
    uploadId: string,
    parts: { ETag: string, PartNumber: number }[]
  ) {
    const res = await this.s3Service.completeMultipartUpload(
      s3Key,
      uploadId,
      parts
    );

    return { success: true, s3Key };
  }

  generateNewMeetingLink() {
    const uniqueIdOfMeeting = UtilsProvider.generateUniqueIdOfMeeting();
    const fullPath = `${this.configService.frontendUrl}/meeting/${uniqueIdOfMeeting}`;

    return fullPath;
  }
}
