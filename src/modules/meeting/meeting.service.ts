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
import { EnhancedLoggerService } from '../../shared/services/enhanced-logger.service';
import { LogCategory } from '../../constants/logger-type.enum';
import { QuestionService } from '../question/question.service';
import { IsInterviewFinishedEarlierDto } from './dtos/is-interview-finished-earlier.dto';
import type { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import { StartInterviewDto } from './dtos/start-interview.dto';
import { InviteToInterviewDto } from './dtos/invite-to-interview.dto';
import { Schedule } from '../../entities/Schedule';

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
    private readonly enhancedLogger: EnhancedLoggerService,
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

    return this.scheduleRepository.findById(scheduleEntity.scheduleId);
  }

  @Transactional()
  async startInterview(
    scheduleId: string,
    startInterviewDto: StartInterviewDto,
  ) {
    this.enhancedLogger.logSeparator('INTERVIEW START PROCESS');
    this.enhancedLogger.startTimer(`start-interview-${scheduleId}`);

    const context = { scheduleId };

    this.enhancedLogger.interviewEvent(
      '🚀 Attempting to start interview',
      { 
        ...context, 
        metadata: { 
          browserName: startInterviewDto.browserName,
          timestamp: new Date().toISOString()
        } 
      },
    );

    this.enhancedLogger.startTimer(`db-fetch-schedule-${scheduleId}`);
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    this.enhancedLogger.endTimer(
      `db-fetch-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule entity retrieved for interview start',
      { 
        scheduleId: scheduleEntity.scheduleId,
        candidateId: scheduleEntity.candidateId.toString(),
        metadata: { 
          jobId: scheduleEntity.jobId,
          scheduledDateTime: scheduleEntity.scheduledDatetime,
          attendedDateTime: scheduleEntity.attendedDatetime
        }
      }
         );

    this.enhancedLogger.startTimer(`db-check-existing-interview-${scheduleEntity.candidateId}`);
    const interviewEntityByCandidateId =
      await this.interviewRepository.findByCandidateIdExtended(
        scheduleEntity.candidateId,
      );
    this.enhancedLogger.endTimer(
      `db-check-existing-interview-${scheduleEntity.candidateId}`,
      LogCategory.DATABASE,
      'Existing interview check completed',
      {
        candidateId: scheduleEntity.candidateId.toString(),
        scheduleId,
        metadata: {
          existingInterview: !!interviewEntityByCandidateId,
          alreadyAttended: !!scheduleEntity.attendedDatetime
        }
      }
    );

    if (interviewEntityByCandidateId || scheduleEntity.attendedDatetime) {
      this.enhancedLogger.error(
        LogCategory.INTERVIEW,
        '❌ Interview already started or attended - blocking duplicate attempt',
        {
          candidateId: scheduleEntity.candidateId.toString(),
          scheduleId,
          metadata: {
            existingInterviewId: interviewEntityByCandidateId?.interviewId,
            attendedDateTime: scheduleEntity.attendedDatetime,
            reason: 'duplicate_interview_attempt'
          }
        },
        'MeetingService'
      );

      throw new BadRequestException(
        'Interview has already happened, can not move forward',
      );
    }

    const now = new Date();
    const scheduledDate = new Date(scheduleEntity.scheduledDatetime);
    
    this.enhancedLogger.startTimer(`db-fetch-expiry-config`);
    const meetingLinkExpiryConfig =
      await this.configRepository.getMeetingLinkExpiryValue();
    this.enhancedLogger.endTimer(
      `db-fetch-expiry-config`,
      LogCategory.DATABASE,
      'Meeting expiry configuration retrieved',
      {
        scheduleId,
        metadata: {
          expiryHours: meetingLinkExpiryConfig?.configValue
        }
      }
    );

    if (!meetingLinkExpiryConfig) {
      this.enhancedLogger.error(
        LogCategory.SYSTEM,
        '⚙️ Meeting link expiry configuration not found',
        { scheduleId },
        'MeetingService'
      );
      throw new BadRequestException('Meeting link expiry config is not found');
    }

    const hoursDifference =
      (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);

    this.enhancedLogger.info(
      LogCategory.INTERVIEW,
      '⏰ Validating interview timing',
      {
        scheduleId,
        metadata: {
          currentTime: now.toISOString(),
          scheduledTime: scheduledDate.toISOString(),
          hoursDifference: hoursDifference.toFixed(2),
          maxAllowedHours: Number(meetingLinkExpiryConfig.configValue),
          isWithinTimeLimit: hoursDifference <= Number(meetingLinkExpiryConfig.configValue)
        }
      },
      'MeetingService'
    );

    if (hoursDifference > Number(meetingLinkExpiryConfig.configValue)) {
      this.enhancedLogger.error(
        LogCategory.INTERVIEW,
        '⏰ Interview attempt outside allowed time window',
        {
          scheduleId,
          metadata: {
            hoursDifference: hoursDifference.toFixed(2),
            maxAllowedHours: Number(meetingLinkExpiryConfig.configValue),
            hoursOverdue: (hoursDifference - Number(meetingLinkExpiryConfig.configValue)).toFixed(2),
            reason: 'time_window_expired'
          }
        },
        'MeetingService'
      );

      throw new BadRequestException(
        `Scheduled time has already passed by more than ${Number(
          meetingLinkExpiryConfig.configValue,
        )} hours`,
      );
    }

    this.enhancedLogger.startTimer(`db-create-interview-${scheduleEntity.candidateId}`);
    this.enhancedLogger.info(
      LogCategory.DATABASE,
      '💾 Creating new interview entity',
      {
        candidateId: scheduleEntity.candidateId.toString(),
        scheduleId,
        metadata: {
          browserName: startInterviewDto.browserName,
          interviewDate: now.toISOString()
        }
      },
      'MeetingService'
    );

    const interviewEntity = await this.interviewRepository.save(
      this.interviewRepository.create({
        interviewDate: now,
        candidateId: scheduleEntity.candidateId,
        browserName: startInterviewDto.browserName,
      }),
    );

    this.enhancedLogger.endTimer(
      `db-create-interview-${scheduleEntity.candidateId}`,
      LogCategory.DATABASE,
      'Interview entity created successfully',
      {
        interviewId: interviewEntity.interviewId.toString(),
        candidateId: scheduleEntity.candidateId.toString(),
        scheduleId
      }
         );

    this.enhancedLogger.startTimer(`db-update-schedule-${scheduleId}`);
    await this.scheduleRepository.update(scheduleId, { attendedDatetime: now });
    this.enhancedLogger.endTimer(
      `db-update-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule attendance updated',
      {
        scheduleId,
        metadata: {
          attendedDateTime: now.toISOString()
        }
      }
         );

    this.enhancedLogger.startTimer(`s3-init-upload-${scheduleId}`);
    this.enhancedLogger.uploadEvent('Initializing multipart upload for interview recording', {
      scheduleId,
      interviewId: interviewEntity.interviewId.toString(),
      candidateId: scheduleEntity.candidateId.toString()
    });

    const { uploadId, s3Key } = await this.initiateMultipartUpload(scheduleId);
    
    this.enhancedLogger.endTimer(
      `s3-init-upload-${scheduleId}`,
      LogCategory.UPLOAD,
      'Multipart upload initialized',
      {
        scheduleId,
        interviewId: interviewEntity.interviewId.toString(),
        metadata: {
          uploadId,
          s3Key
        }
             }
     );

    const totalDuration = this.enhancedLogger.endTimer(
      `start-interview-${scheduleId}`,
      LogCategory.INTERVIEW,
      'Interview start process completed',
      {
        interviewId: interviewEntity.interviewId.toString(),
        candidateId: scheduleEntity.candidateId.toString(),
        scheduleId,
        metadata: {
          browserName: startInterviewDto.browserName,
          uploadId,
          s3Key,
          totalDbOperations: 5
        }
      }
    );

    this.enhancedLogger.success(
      LogCategory.INTERVIEW,
      `🎉 Interview started successfully! Total setup time: ${totalDuration.toFixed(2)}ms`,
      {
        interviewId: interviewEntity.interviewId.toString(),
        candidateId: scheduleEntity.candidateId.toString(),
        scheduleId,
        duration: totalDuration,
        metadata: {
          browserName: startInterviewDto.browserName,
          readyForRecording: true
        }
      },
      'MeetingService'
    );

    return { ...interviewEntity, uploadId, s3Key };
  }

  @Transactional()
  async finishInterview(
    scheduleId: string,
    isInterviewFinishedEarlierDto: IsInterviewFinishedEarlierDto,
  ) {
    this.enhancedLogger.logSeparator('INTERVIEW FINISH PROCESS');
    this.enhancedLogger.startTimer(`finish-interview-${scheduleId}`);

    const context = { scheduleId };

    this.enhancedLogger.interviewEvent(
      '🏁 Starting interview finish process',
      { ...context, metadata: { isFinishedEarlier: isInterviewFinishedEarlierDto.isInterviewFinishedEarlier } },
    );

    this.enhancedLogger.startTimer(`db-fetch-schedule-${scheduleId}`);
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    this.enhancedLogger.endTimer(
      `db-fetch-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule entity retrieved',
      { 
        scheduleId: scheduleEntity.scheduleId,
        candidateId: scheduleEntity.candidateId.toString(),
        metadata: { jobId: scheduleEntity.jobId }
      }
    );

    const candidate = scheduleEntity.candidate;
    this.enhancedLogger.info(
      LogCategory.INTERVIEW,
      `👤 Processing candidate: ${candidate.firstName} ${candidate.lastName}`,
      { 
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: { 
          email: candidate.email,
          phone: candidate.phoneNo 
        }
      },
      'MeetingService'
    );

    this.enhancedLogger.startTimer(`db-fetch-interview-${candidate.candidateId}`);
    const interviewEntityByCandidateId =
      await this.interviewRepository.findByCandidateIdExtended(
        candidate.candidateId,
      );
    this.enhancedLogger.endTimer(
      `db-fetch-interview-${candidate.candidateId}`,
      LogCategory.DATABASE,
      'Interview entity retrieved',
      {
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: {
          browser: interviewEntityByCandidateId.browserName,
          evaluationsCount: interviewEntityByCandidateId.evaluations?.length || 0,
          dishonestsCount: interviewEntityByCandidateId.dishonests?.length || 0
        }
      }
    );

    const interviewEntityUpdate: Partial<Interview> = {};

    if (isInterviewFinishedEarlierDto.isInterviewFinishedEarlier) {
      interviewEntityUpdate.isInterviewFinishedEarlier = true;
      this.enhancedLogger.warn(
        LogCategory.INTERVIEW,
        '⏰ Interview marked as finished early',
        {
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          candidateId: candidate.candidateId.toString(),
          scheduleId
        },
        'MeetingService'
      );
    }

    // const interviewUploads3Response = await this.s3Service.uploadFile(file, 'Complete_Interview');
    // const s3Uri = UtilsProvider.createS3UriFromS3BucketAndKey(interviewUploads3Response.Bucket, interviewUploads3Response.Key);

    // interviewEntityUpdate.videofileS3key = s3Uri;

    if (Object.values(interviewEntityUpdate).length > 0) {
      this.enhancedLogger.startTimer(`db-update-interview-${interviewEntityByCandidateId.interviewId}`);
      this.enhancedLogger.info(
        LogCategory.DATABASE,
        `💾 Updating interview entity`,
        {
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          candidateId: candidate.candidateId.toString(),
          scheduleId,
          metadata: { 
            fieldsToUpdate: Object.keys(interviewEntityUpdate),
            updateData: interviewEntityUpdate
          }
        },
        'MeetingService'
      );

      await this.interviewRepository.update(
        interviewEntityByCandidateId.interviewId,
        interviewEntityUpdate,
      );

      this.enhancedLogger.endTimer(
        `db-update-interview-${interviewEntityByCandidateId.interviewId}`,
        LogCategory.DATABASE,
        'Interview entity updated successfully',
        {
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          candidateId: candidate.candidateId.toString(),
          scheduleId
        }
      );
    } else {
      this.enhancedLogger.info(
        LogCategory.DATABASE,
        'ℹ️ No interview entity updates required',
        {
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          candidateId: candidate.candidateId.toString(),
          scheduleId
        },
        'MeetingService'
      );
    }

    // Slack notification monitoring
    this.enhancedLogger.notificationEvent(
      '📢 Preparing Slack notification payload',
      {
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: {
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          browser: interviewEntityByCandidateId.browserName,
          finishedEarly: interviewEntityUpdate.isInterviewFinishedEarlier,
          evaluationsCount: interviewEntityByCandidateId.evaluations?.length || 0,
          dishonestsCount: interviewEntityByCandidateId.dishonests?.length || 0
        }
      }
    );

    this.enhancedLogger.startTimer(`slack-notification-${scheduleId}`);
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

    this.enhancedLogger.endTimer(
      `slack-notification-${scheduleId}`,
      LogCategory.NOTIFICATION,
      'Slack notification sent successfully',
      {
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        candidateId: candidate.candidateId.toString(),
        scheduleId
      }
    );

    const totalDuration = this.enhancedLogger.endTimer(
      `finish-interview-${scheduleId}`,
      LogCategory.INTERVIEW,
      'Interview finish process completed',
      {
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: {
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          finishedEarly: interviewEntityUpdate.isInterviewFinishedEarlier,
          totalOperations: Object.keys(interviewEntityUpdate).length > 0 ? 4 : 3 // DB queries + optional update + Slack
        }
      }
    );

    this.enhancedLogger.success(
      LogCategory.INTERVIEW,
      `🎉 Interview finished successfully! Total processing time: ${totalDuration.toFixed(2)}ms`,
      {
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        duration: totalDuration
      },
      'MeetingService'
    );

    return UtilsProvider.getMessageOverviewByType(
      MessageTypeEnum.INTERVIEW_FINISHED,
    );
  }

  async saveRecordingForQuestionByMeeting(
    file: Express.Multer.File,
    scheduleId: string,
    questionId: string,
  ) {
    this.enhancedLogger.logSeparator('SAVE INTERVIEW RECORDING');
    this.enhancedLogger.startTimer(`save-recording-${scheduleId}-${questionId}`);

    const context = { scheduleId };

    this.enhancedLogger.uploadEvent(
      '📹 Starting video recording save process',
      { 
        ...context, 
        metadata: { 
          questionId,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          timestamp: new Date().toISOString()
        } 
      },
    );

    this.enhancedLogger.startTimer(`db-fetch-schedule-${scheduleId}`);
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    this.enhancedLogger.endTimer(
      `db-fetch-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule entity retrieved for recording save',
      { 
        scheduleId: scheduleEntity.scheduleId,
        candidateId: scheduleEntity.candidateId.toString(),
        metadata: { 
          jobId: scheduleEntity.jobId
        }
      }
    );

    const candidate = scheduleEntity.candidate;
    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      `📤 Processing recording for candidate: ${candidate.firstName} ${candidate.lastName}`,
      { 
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: { 
          questionId,
          email: candidate.email
        }
      },
      'MeetingService'
         );

    const fileName = `SId-${scheduleId}-QId-${questionId}-CId-${
      candidate.candidateId
    }-${Date.now()}`;

    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      '📝 Generated structured filename for S3 upload',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: {
          questionId,
          generatedFileName: fileName,
          originalFileName: file.originalname,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        }
      },
      'MeetingService'
         );

    this.enhancedLogger.startTimer(`s3-upload-${scheduleId}-${questionId}`);
    this.enhancedLogger.uploadEvent('Uploading video file to S3', {
      scheduleId,
      candidateId: candidate.candidateId.toString(),
      metadata: {
        questionId,
        fileName,
        bucket: 'VideoInterviewFiles',
        fileSize: file.size
      }
    });

    const responseFromS3 = await this.s3Service.uploadFile(
      file,
      'VideoInterviewFiles',
      fileName,
    );

    this.enhancedLogger.endTimer(
      `s3-upload-${scheduleId}-${questionId}`,
      LogCategory.UPLOAD,
      'Video file uploaded to S3 successfully',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: {
          questionId,
          s3Bucket: responseFromS3.Bucket,
          s3Key: responseFromS3.Key,
          s3Location: responseFromS3.Location,
          fileSize: file.size
        }
      }
    );

    const s3Uri = UtilsProvider.createS3UriFromS3BucketAndKey(
      responseFromS3.Bucket,
      responseFromS3.Key,
    );

    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      '🔗 S3 URI generated for video file',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: {
          questionId,
                   s3Uri: s3Uri.substring(0, 100) + '...' // Truncate for logging
       }
     },
       'MeetingService'
     );

    this.enhancedLogger.startTimer(`db-fetch-interview-${candidate.candidateId}`);
    this.enhancedLogger.debug(
      LogCategory.DATABASE,
      '🔍 Fetching interview entity for evaluation creation',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: { questionId }
      },
      'MeetingService'
    );

    const interviewEntityByCandidateId =
      await this.interviewRepository.findByCandidateId(candidate.candidateId); // tmp solution

    this.enhancedLogger.endTimer(
      `db-fetch-interview-${candidate.candidateId}`,
      LogCategory.DATABASE,
      'Interview entity retrieved',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId?.interviewId?.toString(),
        metadata: {
          questionId,
          interviewFound: !!interviewEntityByCandidateId
        }
      }
    );

    if (!interviewEntityByCandidateId) {
      this.enhancedLogger.error(
        LogCategory.DATABASE,
        '❌ Interview entity not found for candidate',
        {
          candidateId: candidate.candidateId.toString(),
          scheduleId,
          metadata: {
            questionId,
            reason: 'interview_not_found'
          }
        },
        'MeetingService'
      );
         }

    this.enhancedLogger.startTimer(`db-create-evaluation-${questionId}`);
    this.enhancedLogger.info(
      LogCategory.DATABASE,
      '💾 Creating evaluation entity for recorded response',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId?.interviewId?.toString(),
        metadata: {
          questionId,
          videoS3Uri: s3Uri.substring(0, 50) + '...'
        }
      },
      'MeetingService'
    );

    const evaluationEntity = await this.evaluationRepository.save(
      this.evaluationRepository.create({
        questionId,
        interviewId: interviewEntityByCandidateId?.interviewId, // tmp solution
        videofileS3key: s3Uri,
      }),
    );

    this.enhancedLogger.endTimer(
      `db-create-evaluation-${questionId}`,
      LogCategory.DATABASE,
      'Evaluation entity created successfully',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId?.interviewId?.toString(),
        metadata: {
          evaluationId: evaluationEntity.evaluationId,
          questionId,
          videoStored: true
        }
             }
     );

    const totalDuration = this.enhancedLogger.endTimer(
      `save-recording-${scheduleId}-${questionId}`,
      LogCategory.UPLOAD,
      'Recording save process completed',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId?.interviewId?.toString(),
        metadata: {
          questionId,
          evaluationId: evaluationEntity.evaluationId,
          fileSize: file.size,
          s3Location: responseFromS3.Location
        }
      }
    );

    this.enhancedLogger.success(
      LogCategory.UPLOAD,
      `🎉 Video recording saved successfully! Total processing time: ${totalDuration.toFixed(2)}ms`,
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId?.interviewId?.toString(),
        duration: totalDuration,
        metadata: {
          questionId,
          evaluationId: evaluationEntity.evaluationId,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
          uploadSuccess: true
        }
      },
      'MeetingService'
    );

    return evaluationEntity;
  }

  @Transactional()
  async saveCheatingForQuestionByMeeting(
    scheduleId: string,
    questionId: string,
  ) {
    this.enhancedLogger.logSeparator('CHEAT DETECTION ALERT');
    this.enhancedLogger.startTimer(`save-cheating-${scheduleId}-${questionId}`);

    const context = { scheduleId };

    this.enhancedLogger.warn(
      LogCategory.INTERVIEW,
      '🚨 CHEAT DETECTION: Suspicious behavior detected during interview',
      { 
        ...context, 
        metadata: { 
          questionId,
          detectionType: 'tab_switch',
          timestamp: new Date().toISOString(),
          severity: 'moderate'
        } 
      },
      'CheatDetectionService'
    );

    this.enhancedLogger.startTimer(`db-fetch-schedule-${scheduleId}`);
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    this.enhancedLogger.endTimer(
      `db-fetch-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule entity retrieved for cheat logging',
      { 
        scheduleId: scheduleEntity.scheduleId,
        candidateId: scheduleEntity.candidateId.toString(),
        metadata: { 
          jobId: scheduleEntity.jobId,
          questionId
        }
      }
    );

    const candidate = scheduleEntity.candidate;
    this.enhancedLogger.warn(
      LogCategory.INTERVIEW,
      `⚠️ Cheat detected for candidate: ${candidate.firstName} ${candidate.lastName}`,
      { 
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        metadata: { 
          questionId,
          email: candidate.email,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          cheatType: 'tab_switch'
        }
      },
             'MeetingService'
     );

    this.enhancedLogger.startTimer(`db-fetch-interview-${candidate.candidateId}`);
    const interviewEntityByCandidateId =
      await this.interviewRepository.findByCandidateId(candidate.candidateId); // tmp solution
    this.enhancedLogger.endTimer(
      `db-fetch-interview-${candidate.candidateId}`,
      LogCategory.DATABASE,
      'Interview entity retrieved for cheat logging',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId?.interviewId?.toString(),
        metadata: {
          questionId,
          interviewFound: !!interviewEntityByCandidateId
        }
      }
    );

    if (!interviewEntityByCandidateId) {
      this.enhancedLogger.error(
        LogCategory.DATABASE,
        '❌ Interview entity not found - cannot log cheat detection',
        {
          candidateId: candidate.candidateId.toString(),
          scheduleId,
          metadata: {
            questionId,
            reason: 'interview_not_found',
            cheatType: 'tab_switch'
          }
        },
        'MeetingService'
      );
      throw new BadRequestException('Interview not found for candidate');
    }

    this.enhancedLogger.startTimer(`db-fetch-dishonest-${interviewEntityByCandidateId.interviewId}-${questionId}`);
    this.enhancedLogger.debug(
      LogCategory.DATABASE,
      '🔍 Checking for existing dishonest behavior records',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        metadata: {
          questionId,
          lookupType: 'existing_cheat_record'
        }
      },
      'MeetingService'
    );

    const findDishonestEntityByQUestionAndInterviewId =
      await this.dishonestRepository.findByInterviewIdAndQuestionId(
        interviewEntityByCandidateId.interviewId,
        questionId,
      );

    this.enhancedLogger.endTimer(
      `db-fetch-dishonest-${interviewEntityByCandidateId.interviewId}-${questionId}`,
      LogCategory.DATABASE,
      'Dishonest entity lookup completed',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        metadata: {
          questionId,
          existingRecord: !!findDishonestEntityByQUestionAndInterviewId,
          currentSwitchCount: findDishonestEntityByQUestionAndInterviewId?.switchCount || 0
        }
      }
    );

    const switchCount =
      (Number(findDishonestEntityByQUestionAndInterviewId?.switchCount) || 0) + 1;

    this.enhancedLogger.warn(
      LogCategory.INTERVIEW,
      `📊 Cheat counter incremented: ${switchCount} tab switches detected`,
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        metadata: {
          questionId,
          previousCount: findDishonestEntityByQUestionAndInterviewId?.switchCount || 0,
          newCount: switchCount,
          increment: 1,
          severity: switchCount >= 3 ? 'high' : switchCount >= 2 ? 'medium' : 'low'
        }
      },
      'MeetingService'
         );

    this.enhancedLogger.startTimer(`db-save-dishonest-${interviewEntityByCandidateId.interviewId}-${questionId}`);
    
    const isNewRecord = !findDishonestEntityByQUestionAndInterviewId;
    
    if (isNewRecord) {
      this.enhancedLogger.info(
        LogCategory.DATABASE,
        '💾 Creating new dishonest behavior record',
        {
          candidateId: candidate.candidateId.toString(),
          scheduleId,
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          metadata: {
            questionId,
            switchCount,
            recordType: 'new_cheat_record'
          }
        },
        'MeetingService'
      );
    } else {
      this.enhancedLogger.info(
        LogCategory.DATABASE,
        '🔄 Updating existing dishonest behavior record',
        {
          candidateId: candidate.candidateId.toString(),
          scheduleId,
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          metadata: {
            questionId,
            oldSwitchCount: findDishonestEntityByQUestionAndInterviewId.switchCount,
            newSwitchCount: switchCount,
            recordType: 'update_cheat_record'
          }
        },
        'MeetingService'
      );
    }

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

    this.enhancedLogger.endTimer(
      `db-save-dishonest-${interviewEntityByCandidateId.interviewId}-${questionId}`,
      LogCategory.DATABASE,
      `Dishonest behavior record ${isNewRecord ? 'created' : 'updated'} successfully`,
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        metadata: {
          questionId,
          finalSwitchCount: switchCount,
          operation: isNewRecord ? 'create' : 'update'
        }
             }
     );

    const totalDuration = this.enhancedLogger.endTimer(
      `save-cheating-${scheduleId}-${questionId}`,
      LogCategory.INTERVIEW,
      'Cheat detection logging completed',
      {
        candidateId: candidate.candidateId.toString(),
        scheduleId,
        interviewId: interviewEntityByCandidateId.interviewId.toString(),
        metadata: {
          questionId,
          switchCount,
          cheatType: 'tab_switch',
          operationType: isNewRecord ? 'new_record' : 'update_record'
        }
      }
         );

    if (switchCount >= 3) {
      this.enhancedLogger.error(
        LogCategory.INTERVIEW,
        `🚨 HIGH SEVERITY ALERT: Candidate has ${switchCount} tab switches - possible cheating`,
        {
          candidateId: candidate.candidateId.toString(),
          scheduleId,
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          duration: totalDuration,
          metadata: {
            questionId,
            switchCount,
            severity: 'high',
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            recommendedAction: 'flag_for_review'
          }
        },
        'MeetingService'
      );
    } else if (switchCount >= 2) {
      this.enhancedLogger.warn(
        LogCategory.INTERVIEW,
        `⚠️ MEDIUM SEVERITY: ${switchCount} tab switches detected - monitor closely`,
        {
          candidateId: candidate.candidateId.toString(),
          scheduleId,
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          duration: totalDuration,
          metadata: {
            questionId,
            switchCount,
            severity: 'medium',
            candidateName: `${candidate.firstName} ${candidate.lastName}`
          }
        },
        'MeetingService'
      );
    } else {
      this.enhancedLogger.info(
        LogCategory.INTERVIEW,
        `ℹ️ Cheat detection logged successfully - Total processing: ${totalDuration.toFixed(2)}ms`,
        {
          candidateId: candidate.candidateId.toString(),
          scheduleId,
          interviewId: interviewEntityByCandidateId.interviewId.toString(),
          duration: totalDuration,
          metadata: {
            questionId,
            switchCount,
            severity: 'low',
            cheatLogged: true
          }
        },
        'MeetingService'
      );
    }

    return UtilsProvider.getMessageOverviewByType(MessageTypeEnum.TAB_SWITCH);
  }

  @Transactional()
  async sendInvitionToCandidate(scheduleId: string, inviteToInterviewDto?: InviteToInterviewDto) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);

    if (scheduleEntity.attendedDatetime) {
      throw new BadRequestException('Interview has already happened, can not move forward');
    }

    const newMeetingLink = this.generateNewMeetingLink();
    const jobTitle = scheduleEntity.job.jobTitle || '';

    const updatedScheduleEntity: Partial<Schedule> = {
      meetingLink: newMeetingLink,
    }

    if (inviteToInterviewDto) {
      updatedScheduleEntity.scheduledDatetime = inviteToInterviewDto.scheduledDate;
    }

    await this.scheduleRepository.update(scheduleEntity.scheduleId, updatedScheduleEntity);
    await this.mailService.send({
      to: scheduleEntity.candidate.email,
      subject: `${scheduleEntity.job.manager.company || 'Hire2o'} Invites You For An AI Interview `,
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
