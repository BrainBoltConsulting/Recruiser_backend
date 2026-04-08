/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-await-in-loop */
/* eslint-disable sonarjs/cognitive-complexity */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { Transactional } from 'typeorm-transactional';

import {
  CompletionReasonEnum,
  CompletionTypeEnum,
} from '../../constants/completion-reason.enum';
import { LogCategory } from '../../constants/logger-type.enum';
import { MessageTypeEnum } from '../../constants/message.enum';
import {
  DAY_NAMES,
  REPORT_BREAKDOWNS,
  TIME_CONSTANTS,
} from '../../constants/report.constant';
import { ReportFilterType } from '../../constants/report-type.enum';
import type { Interview } from '../../entities/Interview';
import type { Schedule } from '../../entities/Schedule';
import { UtilsProvider } from '../../providers/utils.provider';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { ConfigRepository } from '../../repositories/ConfigRepository';
import { DishonestRepository } from '../../repositories/DishonestRepository';
import { EvaluationRepository } from '../../repositories/EvaluationRepository';
import { InterviewRepository } from '../../repositories/InterviewRepository';
import { JobShortlistedProfilesRepository } from '../../repositories/JobShortlistedProfilesRepository';
import { JobsRepository } from '../../repositories/JobsRepository';
import { ManagerRelationshipRepository } from '../../repositories/ManagerRelationshipRepository';
import { ManagerRepository } from '../../repositories/ManagerRepository';
import { ReportMasterRepository } from '../../repositories/ReportMasterRepository';
import { ReportScoreRepository } from '../../repositories/ReportScoreRepository';
import { ScheduleRepository } from '../../repositories/ScheduleRepository';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { S3Service } from '../../shared/services/aws-s3.service';
import { CognitoAuthService } from '../../shared/services/cognito-auth.service';
import { EnhancedLoggerService } from '../../shared/services/enhanced-logger.service';
import { MailService } from '../../shared/services/mail.service';
import { SlackNotificationService } from '../../shared/services/slack-notification.service';
import { QuestionService } from '../question/question.service';
import { InviteToInterviewDto } from './dtos/invite-to-interview.dto';
import { IsInterviewFinishedEarlierDto } from './dtos/is-interview-finished-earlier.dto';
import type { GetManagerReportDto } from './dtos/manager-report-request.dto';
import type { HierarchicalReportDto } from './dtos/manager-report-response.dto';
import { ManagerReportResponseDto } from './dtos/manager-report-response.dto';
import type { ReportPartDto } from './dtos/report-part.dto';
import type { ScheduleInterviewDto } from './dtos/schedule-interview.dto';
import {
  type ScheduleStatusResponseDto,
  ReportStatusEnum,
  ScheduleStatusEnum,
} from './dtos/schedule-status-response.dto';
import { StartInterviewDto } from './dtos/start-interview.dto';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly slackNotificationService: SlackNotificationService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cognitoAuthService: CognitoAuthService,
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
    private readonly managerRelationshipRepository: ManagerRelationshipRepository,
    private readonly managerRepository: ManagerRepository,
    private readonly reportMasterRepository: ReportMasterRepository,
    private readonly reportScoreRepository: ReportScoreRepository,
    private readonly jobShortlistedProfilesRepository: JobShortlistedProfilesRepository,
  ) {}

  async scheduleInterview(scheduleInterviewDto: ScheduleInterviewDto) {
    const cUuid = String(scheduleInterviewDto.cUuid);
    const jUuid = String(scheduleInterviewDto.jUuid);

    this.logger.log(`Scheduling interview for cUuid=${cUuid}, jUuid=${jUuid}`);

    const candidateEntity = await this.candidateRepository.findByCUuid(cUuid);
    this.logger.log(
      `Fetched Candidate: ${candidateEntity.firstName} ${candidateEntity.lastName} (cUuid=${candidateEntity.cUuid})`,
    );

    const jobEntity = await this.jobsRepository.findByJUuid(jUuid);
    this.logger.log(
      `Fetched Job: ${jobEntity.jobTitle ?? ''} (jUuid=${jobEntity.jUuid}, jobId=${jobEntity.jobId})`,
    );

    const findScheduleEntityWithTheSameCandidateAndJob =
      await this.scheduleRepository.findByCUuidAndJUuid(cUuid, jUuid);

    if (findScheduleEntityWithTheSameCandidateAndJob) {
      this.logger.warn(
        `Attempt to schedule duplicate interview for cUuid=${cUuid}, jUuid=${jUuid}`,
      );

      throw new BadRequestException(
        'By candidate id and job id meeting already exists',
      );
    }

    const newSchedule = this.scheduleRepository.create({
      scheduledDatetime: new Date(),
      candidate: candidateEntity,
      candidateId: candidateEntity.candidateId,
      cUuid: candidateEntity.cUuid,
      jobId: jobEntity.jobId,
      jUuid: jobEntity.jUuid,
      job: jobEntity,
    });

    const scheduleEntity = await this.scheduleRepository.save(newSchedule);
    this.logger.log(
      `Interview scheduled successfully | scheduleId=${scheduleEntity.scheduleId}, ` +
        `cUuid=${scheduleEntity.cUuid}, jobId=${scheduleEntity.jobId}, jUuid=${scheduleEntity.jUuid}`,
    );

    const newScheduleId = String(scheduleEntity.scheduleId);
    await this.sendInvitionToCandidate(newScheduleId);

    this.logger.log(
      `Invitation sent to candidate ${scheduleEntity.candidate.firstName} ${scheduleEntity.candidate.lastName}`,
    );

    return this.scheduleRepository.findById(newScheduleId);
  }

  @Transactional()
  async startInterview(
    scheduleId: string,
    startInterviewDto: StartInterviewDto,
  ) {
    this.enhancedLogger.logSeparator('INTERVIEW START PROCESS');
    this.enhancedLogger.startTimer(`start-interview-${scheduleId}`);

    const context = { scheduleId };

    this.enhancedLogger.interviewEvent('🚀 Attempting to start interview', {
      ...context,
      metadata: {
        browserName: startInterviewDto.browserName,
        timestamp: new Date().toISOString(),
      },
    });

    this.enhancedLogger.startTimer(`db-fetch-schedule-${scheduleId}`);
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    this.enhancedLogger.endTimer(
      `db-fetch-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule entity retrieved for interview start',
      {
        scheduleId: scheduleEntity.scheduleId,
        cUuid: String(scheduleEntity.cUuid),
        metadata: {
          jobId: scheduleEntity.jobId,
          jUuid: scheduleEntity.jUuid,
          scheduledDateTime: scheduleEntity.scheduledDatetime,
          attendedDateTime: scheduleEntity.attendedDatetime,
        },
      },
    );

    this.enhancedLogger.startTimer(
      `db-check-existing-interview-${scheduleEntity.cUuid}`,
    );
    const interviewEntityByCUuid =
      await this.interviewRepository.findByCUuidExtended(scheduleEntity.cUuid);
    this.enhancedLogger.endTimer(
      `db-check-existing-interview-${scheduleEntity.cUuid}`,
      LogCategory.DATABASE,
      'Existing interview check completed',
      {
        cUuid: String(scheduleEntity.cUuid),
        scheduleId,
        metadata: {
          existingInterview: Boolean(interviewEntityByCUuid),
          alreadyAttended: Boolean(scheduleEntity.attendedDatetime),
        },
      },
    );

    if (interviewEntityByCUuid || scheduleEntity.attendedDatetime) {
      this.enhancedLogger.error(
        LogCategory.INTERVIEW,
        '❌ Interview already started or attended - blocking duplicate attempt',
        {
          cUuid: String(scheduleEntity.cUuid),
          scheduleId,
          metadata: {
            existingInterviewId: interviewEntityByCUuid?.interviewId,
            attendedDateTime: scheduleEntity.attendedDatetime,
            reason: 'duplicate_interview_attempt',
          },
        },
        'MeetingService',
      );

      throw new BadRequestException(
        'Interview has already happened, can not move forward',
      );
    }

    const now = new Date();
    const scheduledDate = new Date(scheduleEntity.scheduledDatetime);

    this.enhancedLogger.startTimer('db-fetch-expiry-config');
    const meetingLinkExpiryConfig =
      await this.configRepository.getMeetingLinkExpiryValue();
    this.enhancedLogger.endTimer(
      'db-fetch-expiry-config',
      LogCategory.DATABASE,
      'Meeting expiry configuration retrieved',
      {
        scheduleId,
        metadata: {
          expiryHours: meetingLinkExpiryConfig?.configValue,
        },
      },
    );

    if (!meetingLinkExpiryConfig) {
      this.enhancedLogger.error(
        LogCategory.SYSTEM,
        '⚙️ Meeting link expiry configuration not found',
        { scheduleId },
        'MeetingService',
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
          isWithinTimeLimit:
            hoursDifference <= Number(meetingLinkExpiryConfig.configValue),
        },
      },
      'MeetingService',
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
            hoursOverdue: (
              hoursDifference - Number(meetingLinkExpiryConfig.configValue)
            ).toFixed(2),
            reason: 'time_window_expired',
          },
        },
        'MeetingService',
      );

      throw new BadRequestException(
        `Scheduled time has already passed by more than ${Number(
          meetingLinkExpiryConfig.configValue,
        )} hours`,
      );
    }

    this.enhancedLogger.startTimer(
      `db-create-interview-${scheduleEntity.cUuid}`,
    );
    this.enhancedLogger.info(
      LogCategory.DATABASE,
      '💾 Creating new interview entity',
      {
        cUuid: String(scheduleEntity.cUuid),
        scheduleId,
        metadata: {
          browserName: startInterviewDto.browserName,
          interviewDate: now.toISOString(),
        },
      },
      'MeetingService',
    );

    const interviewEntity = await this.interviewRepository.save(
      this.interviewRepository.create({
        interviewDate: now,
        candidateId: scheduleEntity.candidateId,
        cUuid: scheduleEntity.cUuid,
        browserName: startInterviewDto.browserName,
      }),
    );

    this.enhancedLogger.endTimer(
      `db-create-interview-${scheduleEntity.cUuid}`,
      LogCategory.DATABASE,
      'Interview entity created successfully',
      {
        interviewId: interviewEntity.interviewId.toString(),
        cUuid: String(scheduleEntity.cUuid),
        scheduleId,
      },
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
          attendedDateTime: now.toISOString(),
        },
      },
    );

    this.enhancedLogger.startTimer(`s3-init-upload-${scheduleId}`);
    this.enhancedLogger.uploadEvent(
      'Initializing multipart upload for interview recording',
      {
        scheduleId,
        interviewId: interviewEntity.interviewId.toString(),
        cUuid: String(scheduleEntity.cUuid),
      },
    );

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
          s3Key,
        },
      },
    );

    const totalDuration = this.enhancedLogger.endTimer(
      `start-interview-${scheduleId}`,
      LogCategory.INTERVIEW,
      'Interview start process completed',
      {
        interviewId: interviewEntity.interviewId.toString(),
        cUuid: String(scheduleEntity.cUuid),
        scheduleId,
        metadata: {
          browserName: startInterviewDto.browserName,
          uploadId,
          s3Key,
          totalDbOperations: 5,
        },
      },
    );

    this.enhancedLogger.success(
      LogCategory.INTERVIEW,
      `🎉 Interview started successfully! Total setup time: ${totalDuration.toFixed(
        2,
      )}ms`,
      {
        interviewId: interviewEntity.interviewId.toString(),
        cUuid: String(scheduleEntity.cUuid),
        scheduleId,
        duration: totalDuration,
        metadata: {
          browserName: startInterviewDto.browserName,
          readyForRecording: true,
        },
      },
      'MeetingService',
    );

    return { ...interviewEntity, uploadId, s3Key };
  }

  @Transactional()
  async finishInterview(
    scheduleId: string,
    isInterviewFinishedEarlierDto: IsInterviewFinishedEarlierDto,
  ) {
    this.enhancedLogger.logSeparator('INTERVIEW FINISH PROCESS');
    this.enhancedLogger.startTimer(`finish-interview-scheduleId-${scheduleId}`);

    const context = { scheduleId };

    const completionReason =
      isInterviewFinishedEarlierDto.completionReason ||
      CompletionReasonEnum.NORMAL;

    this.enhancedLogger.interviewEvent('🏁 Starting interview finish process', {
      ...context,
      metadata: {
        isFinishedEarlier:
          isInterviewFinishedEarlierDto.isInterviewFinishedEarlier,
        completionReason,
        completionType: isInterviewFinishedEarlierDto.isInterviewFinishedEarlier
          ? CompletionTypeEnum.EARLY
          : CompletionTypeEnum.NORMAL,
      },
    });

    // Add specific logging based on completion reason
    if (completionReason === CompletionReasonEnum.TAB_CLOSE) {
      this.enhancedLogger.warn(
        LogCategory.INTERVIEW,
        '🚨 Interview completed due to TAB CLOSE - user closed browser tab',
        {
          ...context,
          metadata: {
            completionReason: CompletionReasonEnum.TAB_CLOSE,
            warningType: 'tab_close_completion',
            requiresAttention: true,
          },
        },
        'MeetingService',
      );
      // eslint-disable-next-line sonarjs/elseif-without-else
    } else if (isInterviewFinishedEarlierDto.isInterviewFinishedEarlier) {
      this.enhancedLogger.warn(
        LogCategory.INTERVIEW,
        '⚠️ Interview completed early',
        {
          ...context,
          metadata: {
            completionReason,
            warningType: 'early_completion',
            requiresAttention: true,
          },
        },
        'MeetingService',
      );
    }

    // CRITICAL OPERATIONS - These must complete before returning response
    this.enhancedLogger.startTimer(`db-fetch-schedule-${scheduleId}`);
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    this.enhancedLogger.endTimer(
      `db-fetch-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule entity retrieved',
      {
        scheduleId: scheduleEntity.scheduleId,
        cUuid: String(scheduleEntity.cUuid),
        metadata: { jobId: scheduleEntity.jobId, jUuid: scheduleEntity.jUuid },
      },
    );

    const candidate = scheduleEntity.candidate;
    this.enhancedLogger.info(
      LogCategory.INTERVIEW,
      `👤 Processing candidate: ${candidate.firstName} ${candidate.lastName}`,
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          email: candidate.email,
          phone: candidate.phoneNo,
        },
      },
      'MeetingService',
    );

    this.enhancedLogger.startTimer(
      `db-fetch-interview-${candidate.cUuid}`,
    );
    const interviewEntityByCUuid =
      await this.interviewRepository.findByCUuidExtended(candidate.cUuid);
    this.enhancedLogger.endTimer(
      `db-fetch-interview-${candidate.cUuid}`,
      LogCategory.DATABASE,
      'Interview entity retrieved',
      {
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          browser: interviewEntityByCUuid.browserName,
          evaluationsCount:
          interviewEntityByCUuid.evaluations?.length || 0,
          dishonestsCount: interviewEntityByCUuid.dishonests?.length || 0,
        },
      },
    );

    const interviewEntityUpdate: Partial<Interview> = {};

    if (isInterviewFinishedEarlierDto.isInterviewFinishedEarlier) {
      interviewEntityUpdate.isInterviewFinishedEarlier = true;
      this.enhancedLogger.warn(
        LogCategory.INTERVIEW,
        '⏰ Interview marked as finished early',
        {
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          cUuid: String(candidate.cUuid),
          scheduleId,
        },
        'MeetingService',
      );
    }

    if (Object.values(interviewEntityUpdate).length > 0) {
      this.enhancedLogger.startTimer(
        `db-update-interview-${interviewEntityByCUuid.interviewId}`,
      );
      this.enhancedLogger.info(
        LogCategory.DATABASE,
        '💾 Updating interview entity',
        {
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          cUuid: String(candidate.cUuid),
          scheduleId,
          metadata: {
            fieldsToUpdate: Object.keys(interviewEntityUpdate),
            updateData: interviewEntityUpdate,
          },
        },
        'MeetingService',
      );

      await this.interviewRepository.update(
        { interviewId: interviewEntityByCUuid.interviewId },
        interviewEntityUpdate,
      );

      this.enhancedLogger.endTimer(
        `db-update-interview-${interviewEntityByCUuid.interviewId}`,
        LogCategory.DATABASE,
        'Interview entity updated successfully',
        {
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          cUuid: String(candidate.cUuid),
          scheduleId,
        },
      );
    } else {
      this.enhancedLogger.info(
        LogCategory.DATABASE,
        'ℹ️ No interview entity updates required',
        {
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          cUuid: String(candidate.cUuid),
          scheduleId,
        },
        'MeetingService',
      );
    }

    // Log completion of critical operations
    const criticalOperationsDuration = this.enhancedLogger.endTimer(
      `finish-interview-scheduleId-${scheduleId}`,
      LogCategory.INTERVIEW,
      'Critical operations completed - returning early response',
      {
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          finishedEarly: interviewEntityUpdate.isInterviewFinishedEarlier,
          completionReason,
          completionType:
            isInterviewFinishedEarlierDto.isInterviewFinishedEarlier
              ? CompletionTypeEnum.EARLY
              : CompletionTypeEnum.NORMAL,
        },
      },
    );

    this.enhancedLogger.info(
      LogCategory.INTERVIEW,
      '🚀 Returning early response to frontend - background processing will continue',
      {
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        cUuid: String(candidate.cUuid),
        scheduleId,
        duration: criticalOperationsDuration,
        metadata: {
          completionReason,
          completionType:
            isInterviewFinishedEarlierDto.isInterviewFinishedEarlier
              ? CompletionTypeEnum.EARLY
              : CompletionTypeEnum.NORMAL,
        },
      },
      'MeetingService',
    );

    // BACKGROUND OPERATIONS - These continue after response is sent
    this.continueBackgroundProcessing(
      scheduleId,
      scheduleEntity,
      candidate,
      interviewEntityByCUuid,
      interviewEntityUpdate,
      completionReason,
      isInterviewFinishedEarlierDto.isInterviewFinishedEarlier,
    ).catch((error) => {
      this.logger.error(
        `Background processing failed for interview ${interviewEntityByCUuid.interviewId} (cUuid=${candidate.cUuid}): ${error.message}`,
        error.stack,
      );
    });

    // Return immediate response
    return UtilsProvider.getMessageOverviewByType(
      MessageTypeEnum.INTERVIEW_FINISHED,
    );
  }

  /**
   * Continue background processing after returning early response
   */
  private async continueBackgroundProcessing(
    scheduleId: string,
    scheduleEntity: any,
    candidate: any,
    interviewEntityByCUuid: any,
    interviewEntityUpdate: Partial<Interview>,
    completionReason: string,
    isFinishedEarly: boolean,
  ): Promise<void> {
    this.enhancedLogger.startTimer(`background-processing-${scheduleId}`);
    this.enhancedLogger.info(
      LogCategory.INTERVIEW,
      '🔄 Starting background processing',
      {
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          operations: ['slack_notification', 'process_api_call'],
        },
      },
      'MeetingService',
    );

    try {
      // Slack notification - wrapped in try-catch to ensure it doesn't break other background operations
      // eslint-disable-next-line @typescript-eslint/naming-convention
      let slackNotificationSuccess = false;

      try {
        this.enhancedLogger.notificationEvent(
          '📢 Preparing Slack notification payload',
          {
            interviewId: interviewEntityByCUuid.interviewId.toString(),
            cUuid: String(candidate.cUuid),
            scheduleId,
            metadata: {
              candidateName: `${candidate.firstName} ${candidate.lastName}`,
              browser: interviewEntityByCUuid.browserName,
              finishedEarly: interviewEntityUpdate.isInterviewFinishedEarlier,
              evaluationsCount:
              interviewEntityByCUuid.evaluations?.length || 0,
              dishonestsCount:
              interviewEntityByCUuid.dishonests?.length || 0,
              vocabScoresCount:
              interviewEntityByCUuid.vocabScores?.length || 0,
            },
          },
        );

        this.enhancedLogger.startTimer(`slack-notification-${scheduleId}`);
        slackNotificationSuccess =
          await this.slackNotificationService.sendBlocks({
            blocks: this.slackNotificationService.formatInterviewSlackPayload({
              interviewId: interviewEntityByCUuid.interviewId.toString(),
              scheduleId: scheduleEntity.scheduleId,
              jobId: scheduleEntity.jobId,
              jUuid: scheduleEntity.jUuid,
              candidate: {
                cUuid: String(candidate.cUuid),
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                fullName: candidate.firstName + ' ' + candidate.lastName,
              },
              browser: interviewEntityByCUuid.browserName,
              attendedTime: scheduleEntity.attendedDatetime,
              finishedEarly: interviewEntityUpdate.isInterviewFinishedEarlier,
              completionReason,
              evaluations: interviewEntityByCUuid.evaluations,
              dishonests: interviewEntityByCUuid.dishonests,
            }),
          });

        void this.enhancedLogger.endTimer(
          `slack-notification-${scheduleId}`,
          LogCategory.NOTIFICATION,
          slackNotificationSuccess
            ? 'Slack notification sent successfully'
            : 'Slack notification failed after retries',
          {
            interviewId: interviewEntityByCUuid.interviewId.toString(),
            cUuid: String(candidate.cUuid),
            scheduleId,
            metadata: {
              success: slackNotificationSuccess,
            },
          },
        );

        if (!slackNotificationSuccess) {
          this.enhancedLogger.warn(
            LogCategory.NOTIFICATION,
            '⚠️ Slack notification failed after all retry attempts',
            {
              interviewId: interviewEntityByCUuid.interviewId.toString(),
              cUuid: String(candidate.cUuid),
              scheduleId,
              metadata: {
                candidateName: `${candidate.firstName} ${candidate.lastName}`,
                completionReason,
              },
            },
            'MeetingService',
          );
        }
      } catch (error) {
        // Catch any unexpected errors from Slack notification (shouldn't happen with new implementation)
        this.enhancedLogger.error(
          LogCategory.NOTIFICATION,
          '❌ Unexpected error during Slack notification',
          {
            interviewId: interviewEntityByCUuid.interviewId.toString(),
            cUuid: String(candidate.cUuid),
            scheduleId,
            metadata: {
              error: error.message,
              errorStack: error.stack,
            },
          },
          'MeetingService',
        );

        this.logger.error(
          `Unexpected error sending Slack notification for interview ${interviewEntityByCUuid.interviewId} (cUuid=${candidate.cUuid}): ${error.message}`,
          error.stack,
        );

        // Continue with other background operations even if Slack fails
        slackNotificationSuccess = false;
      }

      // Process API call
      this.enhancedLogger.startTimer(
        `process-api-call-${candidate.cUuid}`,
      );
      this.enhancedLogger.info(
        LogCategory.API,
        '🔄 Calling process API endpoint',
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          metadata: {
            endpoint: this.apiConfigService.processApiUrl,
          },
        },
        'MeetingService',
      );

      try {
        const cognitoIdToken = await this.cognitoAuthService.getIdToken();
        const cognitoAccessToken =
          await this.cognitoAuthService.getAccessToken();

        this.logger.debug('Process API call details:', {
          url: this.apiConfigService.processApiUrl,
          cUuid: String(candidate.cUuid),
          idTokenLength: cognitoIdToken?.length || 0,
          accessTokenLength: cognitoAccessToken?.length || 0,
          idTokenPrefix: cognitoIdToken?.slice(0, 20) + '...',
          accessTokenPrefix: cognitoAccessToken?.slice(0, 20) + '...',
        });

        // Use ID token as it works in the AWS Authorizer test
        const processApiHeaders: Record<string, string> = {
          Authorization: `Bearer ${cognitoIdToken}`,
        };
        processApiHeaders['Content-Type'] = 'application/json';

        const processApiResponse = await axios.post(
          this.apiConfigService.processApiUrl,
          {
            cUuid: String(candidate.cUuid),
          },
          {
            timeout: 30_000, // 30 seconds timeout
            headers: processApiHeaders,
          },
        );

        this.enhancedLogger.endTimer(
          `process-api-call-${candidate.cUuid}`,
          LogCategory.API,
          'Process API call completed successfully',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            metadata: {
              statusCode: processApiResponse.status,
              responseData: processApiResponse.data,
            },
          },
        );

        this.enhancedLogger.success(
          LogCategory.API,
          '✅ Process API call successful',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            metadata: {
              statusCode: processApiResponse.status,
            },
          },
          'MeetingService',
        );
      } catch (error) {
        // Enhanced error logging for Process API debugging
        this.logger.error('Process API call failed with detailed error:', {
          message: error.message,
          cUuid: String(candidate.cUuid),
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
          },
        });

        // Check if it's a Cognito authentication error
        const isCognitoError = error.message?.includes(
          'Cognito authentication failed',
        );

        this.enhancedLogger.endTimer(
          `process-api-call-${candidate.cUuid}`,
          LogCategory.API,
          isCognitoError
            ? 'Process API call failed - Cognito authentication error'
            : 'Process API call failed',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            metadata: {
              error: error.message,
              statusCode: error.response?.status,
              errorData: error.response?.data,
              isCognitoError,
            },
          },
        );

        this.enhancedLogger.error(
          LogCategory.API,
          '❌ Process API call failed',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            metadata: {
              error: error.message,
              statusCode: error.response?.status,
            },
          },
          'MeetingService',
        );

        // Log the error but don't throw it to avoid breaking the background processing
        this.logger.error(
          `Failed to call process API (cUuid=${candidate.cUuid}): ${error.message}`,
          error.stack,
        );
      }

      // Final summary
      const totalBackgroundDuration = this.enhancedLogger.endTimer(
        `background-processing-${scheduleId}`,
        LogCategory.INTERVIEW,
        'Background processing completed',
        {
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          cUuid: String(candidate.cUuid),
          scheduleId,
          metadata: {
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            finishedEarly: interviewEntityUpdate.isInterviewFinishedEarlier,
            completionReason,
            completionType: isFinishedEarly
              ? CompletionTypeEnum.EARLY
              : CompletionTypeEnum.NORMAL,
          },
        },
      );

      // Final summary with completion type
      let finalMessage: string;

      if (completionReason === CompletionReasonEnum.TAB_CLOSE) {
        finalMessage = `🚨 Interview completed due to TAB CLOSE! Background processing time: ${totalBackgroundDuration.toFixed(
          2,
        )}ms`;
      } else if (isFinishedEarly) {
        finalMessage = `⚠️ Interview completed EARLY! Background processing time: ${totalBackgroundDuration.toFixed(
          2,
        )}ms`;
      } else {
        finalMessage = `🎉 Interview finished successfully! Background processing time: ${totalBackgroundDuration.toFixed(
          2,
        )}ms`;
      }

      this.enhancedLogger.success(
        LogCategory.INTERVIEW,
        finalMessage,
        {
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          cUuid: String(candidate.cUuid),
          scheduleId,
          duration: totalBackgroundDuration,
          metadata: {
            completionReason,
            completionType: isFinishedEarly
              ? CompletionTypeEnum.EARLY
              : CompletionTypeEnum.NORMAL,
            finishedEarly: isFinishedEarly,
          },
        },
        'MeetingService',
      );
    } catch (error) {
      this.enhancedLogger.endTimer(
        `background-processing-${scheduleId}`,
        LogCategory.INTERVIEW,
        'Background processing failed',
        {
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          cUuid: String(candidate.cUuid),
          scheduleId,
          metadata: {
            error: error.message,
          },
        },
      );

      this.enhancedLogger.error(
        LogCategory.INTERVIEW,
        '❌ Background processing failed',
        {
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          cUuid: String(candidate.cUuid),
          scheduleId,
          metadata: {
            error: error.message,
          },
        },
        'MeetingService',
      );

      throw error; // Re-throw to be caught by the caller
    }
  }

  async saveRecordingForQuestionByMeeting(
    file: Express.Multer.File,
    scheduleId: string,
    questionId: string,
  ) {
    this.enhancedLogger.logSeparator('SAVE INTERVIEW RECORDING');
    this.enhancedLogger.startTimer(
      `save-recording-${scheduleId}-${questionId}`,
    );

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
          timestamp: new Date().toISOString(),
        },
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
        cUuid: String(scheduleEntity.cUuid),
        metadata: {
          jobId: scheduleEntity.jobId,
          jUuid: scheduleEntity.jUuid,
        },
      },
    );

    const candidate = scheduleEntity.candidate;
    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      `📤 Processing recording for candidate: ${candidate.firstName} ${candidate.lastName}`,
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          email: candidate.email,
        },
      },
      'MeetingService',
    );

    const fileName = `CId-${
      candidate.cUuid
    }-SId-${scheduleId}-QId-${questionId}-${Date.now()}`;

    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      '📝 Generated structured filename for S3 upload',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          generatedFileName: fileName,
          originalFileName: file.originalname,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
      },
      'MeetingService',
    );

    this.enhancedLogger.startTimer(`s3-upload-${scheduleId}-${questionId}`);
    this.enhancedLogger.uploadEvent('Uploading video file to S3', {
      scheduleId,
      cUuid: String(candidate.cUuid),
      metadata: {
        questionId,
        fileName,
        bucket: 'VideoInterviewFiles',
        fileSize: file.size,
      },
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
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          s3Bucket: responseFromS3.Bucket,
          s3Key: responseFromS3.Key,
          s3Location: responseFromS3.Location,
          fileSize: file.size,
        },
      },
    );

    const s3Uri = UtilsProvider.createS3UriFromS3BucketAndKey(
      responseFromS3.Bucket,
      responseFromS3.Key,
    );

    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      '🔗 S3 URI generated for video file',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          s3Uri: s3Uri.slice(0, 100) + '...', // Truncate for logging
        },
      },
      'MeetingService',
    );

    this.enhancedLogger.startTimer(
      `db-fetch-interview-${candidate.cUuid}`,
    );
    this.enhancedLogger.debug(
      LogCategory.DATABASE,
      '🔍 Fetching interview entity for evaluation creation',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: { questionId },
      },
      'MeetingService',
    );

    const interviewEntityByCUuid =
      await this.interviewRepository.findByCUuid(candidate.cUuid); // tmp solution

    this.enhancedLogger.endTimer(
      `db-fetch-interview-${candidate.cUuid}`,
      LogCategory.DATABASE,
      'Interview entity retrieved',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        metadata: {
          questionId,
          interviewFound: Boolean(interviewEntityByCUuid),
        },
      },
    );

    if (!interviewEntityByCUuid) {
      this.enhancedLogger.error(
        LogCategory.DATABASE,
        '❌ Interview entity not found for candidate',
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          metadata: {
            questionId,
            reason: 'interview_not_found',
          },
        },
        'MeetingService',
      );
    }

    this.enhancedLogger.startTimer(
      `db-find-or-create-evaluation-${questionId}`,
    );

    // Use database transaction with advisory lock to prevent race conditions
    const lockId =
      `evaluation_${questionId}_${interviewEntityByCUuid?.interviewId}`.replace(
        /\W/g,
        '_',
      );

    this.enhancedLogger.info(
      LogCategory.DATABASE,
      '🔒 Using database advisory lock to prevent race conditions',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        metadata: {
          questionId,
          lockId,
          videoS3Uri: s3Uri.slice(0, 50) + '...',
        },
      },
      'MeetingService',
    );

    const queryRunner =
      this.evaluationRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let evaluationEntity: any;

    try {
      // Acquire advisory lock
      await queryRunner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        lockId,
      ]);

      // Now safely check and create/update
      evaluationEntity = await queryRunner.manager.findOne('Evaluation', {
        where: {
          questionId,
          interviewId: interviewEntityByCUuid?.interviewId,
        },
      });

      if (evaluationEntity) {
        // Update existing
        this.enhancedLogger.info(
          LogCategory.DATABASE,
          '🔄 Evaluation entity found, updating with camera recording',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            interviewId: interviewEntityByCUuid?.interviewId?.toString(),
            metadata: {
              evaluationId: evaluationEntity.evaluationId,
              questionId,
              videoS3Uri: s3Uri.slice(0, 50) + '...',
            },
          },
          'MeetingService',
        );

        evaluationEntity.videofileS3key = s3Uri;
        evaluationEntity = await queryRunner.manager.save(
          'Evaluation',
          evaluationEntity,
        );

        this.enhancedLogger.endTimer(
          `db-find-or-create-evaluation-${questionId}`,
          LogCategory.DATABASE,
          'Evaluation entity updated successfully with camera recording',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            interviewId: interviewEntityByCUuid?.interviewId?.toString(),
            metadata: {
              evaluationId: evaluationEntity.evaluationId,
              questionId,
              videoStored: true,
              action: 'updated',
            },
          },
        );
      } else {
        // Create new
        this.enhancedLogger.info(
          LogCategory.DATABASE,
          '💾 Creating new evaluation entity for camera recording',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            interviewId: interviewEntityByCUuid?.interviewId?.toString(),
            metadata: {
              questionId,
              videoS3Uri: s3Uri.slice(0, 50) + '...',
            },
          },
          'MeetingService',
        );

        evaluationEntity = await queryRunner.manager.save('Evaluation', {
          questionId,
          interviewId: interviewEntityByCUuid?.interviewId,
          videofileS3key: s3Uri,
        });

        this.enhancedLogger.endTimer(
          `db-find-or-create-evaluation-${questionId}`,
          LogCategory.DATABASE,
          'Evaluation entity created successfully with camera recording',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            interviewId: interviewEntityByCUuid?.interviewId?.toString(),
            metadata: {
              evaluationId: evaluationEntity.evaluationId,
              questionId,
              videoStored: true,
              action: 'created',
            },
          },
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.enhancedLogger.error(
        LogCategory.DATABASE,
        '❌ Database operation failed for camera recording',
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          interviewId: interviewEntityByCUuid?.interviewId?.toString(),
          metadata: {
            questionId,
            error: error.message,
          },
        },
        'MeetingService',
      );

      throw error;
    } finally {
      await queryRunner.release();
    }

    const totalDuration = this.enhancedLogger.endTimer(
      `save-recording-${scheduleId}-${questionId}`,
      LogCategory.UPLOAD,
      'Recording save process completed',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        metadata: {
          questionId,
          evaluationId: evaluationEntity.evaluationId,
          fileSize: file.size,
          s3Location: responseFromS3.Location,
        },
      },
    );

    this.enhancedLogger.success(
      LogCategory.UPLOAD,
      `🎉 Video recording saved successfully! Total processing time: ${totalDuration.toFixed(
        2,
      )}ms`,
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        duration: totalDuration,
        metadata: {
          questionId,
          evaluationId: evaluationEntity.evaluationId,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
          uploadSuccess: true,
        },
      },
      'MeetingService',
    );

    return evaluationEntity;
  }

  async saveScreenRecordingForQuestionByMeeting(
    file: Express.Multer.File,
    scheduleId: string,
    questionId: string,
  ) {
    this.enhancedLogger.logSeparator('SAVE SCREEN RECORDING');
    this.enhancedLogger.startTimer(
      `save-screen-recording-${scheduleId}-${questionId}`,
    );

    const context = { scheduleId };

    this.enhancedLogger.uploadEvent(
      '🖥️ Starting screen recording save process',
      {
        ...context,
        metadata: {
          questionId,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          timestamp: new Date().toISOString(),
        },
      },
    );

    this.enhancedLogger.startTimer(`db-fetch-schedule-${scheduleId}`);
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    this.enhancedLogger.endTimer(
      `db-fetch-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule entity retrieved for screen recording save',
      {
        scheduleId: scheduleEntity.scheduleId,
        cUuid: String(scheduleEntity.cUuid),
        metadata: {
          jobId: scheduleEntity.jobId,
          jUuid: scheduleEntity.jUuid,
        },
      },
    );

    const candidate = scheduleEntity.candidate;
    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      `📤 Processing screen recording for candidate: ${candidate.firstName} ${candidate.lastName}`,
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          email: candidate.email,
        },
      },
      'MeetingService',
    );

    const fileName = `CId-${
      candidate.cUuid
    }-SId-${scheduleId}-QId-${questionId}-${Date.now()}-screen`;

    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      '📝 Generated structured filename for screen recording S3 upload',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          generatedFileName: fileName,
          originalFileName: file.originalname,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
      },
      'MeetingService',
    );

    this.enhancedLogger.startTimer(
      `s3-screen-upload-${scheduleId}-${questionId}`,
    );
    this.enhancedLogger.uploadEvent('Uploading screen recording to S3', {
      scheduleId,
      cUuid: String(candidate.cUuid),
      metadata: {
        questionId,
        fileName,
        bucket: 'VideoInterviewFiles',
        fileSize: file.size,
      },
    });

    const responseFromS3 = await this.s3Service.uploadFile(
      file,
      'VideoInterviewFiles',
      fileName,
    );

    this.enhancedLogger.endTimer(
      `s3-screen-upload-${scheduleId}-${questionId}`,
      LogCategory.UPLOAD,
      'Screen recording uploaded to S3 successfully',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          s3Bucket: responseFromS3.Bucket,
          s3Key: responseFromS3.Key,
          s3Location: responseFromS3.Location,
          fileSize: file.size,
        },
      },
    );

    const s3Uri = UtilsProvider.createS3UriFromS3BucketAndKey(
      responseFromS3.Bucket,
      responseFromS3.Key,
    );

    this.enhancedLogger.info(
      LogCategory.UPLOAD,
      '🔗 S3 URI generated for screen recording',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          s3Uri: s3Uri.slice(0, 100) + '...', // Truncate for logging
        },
      },
      'MeetingService',
    );

    this.enhancedLogger.startTimer(
      `db-fetch-interview-${candidate.cUuid}`,
    );
    this.enhancedLogger.debug(
      LogCategory.DATABASE,
      '🔍 Fetching interview entity for evaluation update',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: { questionId },
      },
      'MeetingService',
    );

    const interviewEntityByCUuid =
      await this.interviewRepository.findByCUuid(candidate.cUuid);

    this.enhancedLogger.endTimer(
      `db-fetch-interview-${candidate.cUuid}`,
      LogCategory.DATABASE,
      'Interview entity retrieved',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        metadata: {
          questionId,
          interviewFound: Boolean(interviewEntityByCUuid),
        },
      },
    );

    if (!interviewEntityByCUuid) {
      this.enhancedLogger.error(
        LogCategory.DATABASE,
        '❌ Interview entity not found for candidate',
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          metadata: {
            questionId,
            reason: 'interview_not_found',
          },
        },
        'MeetingService',
      );
    }

    this.enhancedLogger.startTimer(
      `db-find-or-create-evaluation-${questionId}`,
    );

    // Use database transaction with advisory lock to prevent race conditions
    const lockId =
      `evaluation_${questionId}_${interviewEntityByCUuid?.interviewId}`.replace(
        /\W/g,
        '_',
      );

    this.enhancedLogger.info(
      LogCategory.DATABASE,
      '🔒 Using database advisory lock to prevent race conditions',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        metadata: {
          questionId,
          lockId,
          screenVideoS3Uri: s3Uri.slice(0, 50) + '...',
        },
      },
      'MeetingService',
    );

    const queryRunner =
      this.evaluationRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let evaluationEntity: any;

    try {
      // Acquire advisory lock
      await queryRunner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        lockId,
      ]);

      // Now safely check and create/update
      evaluationEntity = await queryRunner.manager.findOne('Evaluation', {
        where: {
          questionId,
          interviewId: interviewEntityByCUuid?.interviewId,
        },
      });

      if (evaluationEntity) {
        // Update existing
        this.enhancedLogger.info(
          LogCategory.DATABASE,
          '🔄 Evaluation entity found, updating with screen recording',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            interviewId: interviewEntityByCUuid?.interviewId?.toString(),
            metadata: {
              evaluationId: evaluationEntity.evaluationId,
              questionId,
              screenVideoS3Uri: s3Uri.slice(0, 50) + '...',
            },
          },
          'MeetingService',
        );

        evaluationEntity.videofilename = s3Uri;
        evaluationEntity = await queryRunner.manager.save(
          'Evaluation',
          evaluationEntity,
        );

        this.enhancedLogger.endTimer(
          `db-find-or-create-evaluation-${questionId}`,
          LogCategory.DATABASE,
          'Evaluation entity updated successfully with screen recording',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            interviewId: interviewEntityByCUuid?.interviewId?.toString(),
            metadata: {
              evaluationId: evaluationEntity.evaluationId,
              questionId,
              screenVideoStored: true,
              action: 'updated',
            },
          },
        );
      } else {
        // Create new
        this.enhancedLogger.info(
          LogCategory.DATABASE,
          '💾 Creating new evaluation entity for screen recording',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            interviewId: interviewEntityByCUuid?.interviewId?.toString(),
            metadata: {
              questionId,
              screenVideoS3Uri: s3Uri.slice(0, 50) + '...',
            },
          },
          'MeetingService',
        );

        evaluationEntity = await queryRunner.manager.save('Evaluation', {
          questionId,
          interviewId: interviewEntityByCUuid?.interviewId,
          videofilename: s3Uri,
        });

        this.enhancedLogger.endTimer(
          `db-find-or-create-evaluation-${questionId}`,
          LogCategory.DATABASE,
          'Evaluation entity created successfully with screen recording',
          {
            cUuid: String(candidate.cUuid),
            scheduleId,
            interviewId: interviewEntityByCUuid?.interviewId?.toString(),
            metadata: {
              evaluationId: evaluationEntity.evaluationId,
              questionId,
              screenVideoStored: true,
              action: 'created',
            },
          },
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.enhancedLogger.error(
        LogCategory.DATABASE,
        '❌ Database operation failed for screen recording',
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          interviewId: interviewEntityByCUuid?.interviewId?.toString(),
          metadata: {
            questionId,
            error: error.message,
          },
        },
        'MeetingService',
      );

      throw error;
    } finally {
      await queryRunner.release();
    }

    const totalDuration = this.enhancedLogger.endTimer(
      `save-screen-recording-${scheduleId}-${questionId}`,
      LogCategory.UPLOAD,
      'Screen recording save process completed',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        metadata: {
          questionId,
          evaluationId: evaluationEntity.evaluationId,
          fileSize: file.size,
          s3Location: responseFromS3.Location,
        },
      },
    );

    this.enhancedLogger.success(
      LogCategory.UPLOAD,
      `🎉 Screen recording saved successfully! Total processing time: ${totalDuration.toFixed(
        2,
      )}ms`,
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        duration: totalDuration,
        metadata: {
          questionId,
          evaluationId: evaluationEntity.evaluationId,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
          uploadSuccess: true,
        },
      },
      'MeetingService',
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
          severity: 'moderate',
        },
      },
      'CheatDetectionService',
    );

    this.enhancedLogger.startTimer(`db-fetch-schedule-${scheduleId}`);
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);
    this.enhancedLogger.endTimer(
      `db-fetch-schedule-${scheduleId}`,
      LogCategory.DATABASE,
      'Schedule entity retrieved for cheat logging',
      {
        scheduleId: scheduleEntity.scheduleId,
        cUuid: String(scheduleEntity.cUuid),
        metadata: {
          jobId: scheduleEntity.jobId,
          jUuid: scheduleEntity.jUuid,
          questionId,
        },
      },
    );

    const candidate = scheduleEntity.candidate;
    this.enhancedLogger.warn(
      LogCategory.INTERVIEW,
      `⚠️ Cheat detected for candidate: ${candidate.firstName} ${candidate.lastName}`,
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        metadata: {
          questionId,
          email: candidate.email,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          cheatType: 'tab_switch',
        },
      },
      'MeetingService',
    );

    this.enhancedLogger.startTimer(
      `db-fetch-interview-${candidate.cUuid}`,
    );
    const interviewEntityByCUuid =
      await this.interviewRepository.findByCUuid(candidate.cUuid); // tmp solution
    this.enhancedLogger.endTimer(
      `db-fetch-interview-${candidate.cUuid}`,
      LogCategory.DATABASE,
      'Interview entity retrieved for cheat logging',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid?.interviewId?.toString(),
        metadata: {
          questionId,
          interviewFound: Boolean(interviewEntityByCUuid),
        },
      },
    );

    if (!interviewEntityByCUuid) {
      this.enhancedLogger.error(
        LogCategory.DATABASE,
        '❌ Interview entity not found - cannot log cheat detection',
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          metadata: {
            questionId,
            reason: 'interview_not_found',
            cheatType: 'tab_switch',
          },
        },
        'MeetingService',
      );

      throw new BadRequestException('Interview not found for candidate');
    }

    this.enhancedLogger.startTimer(
      `db-fetch-dishonest-${interviewEntityByCUuid.interviewId}-${questionId}`,
    );
    this.enhancedLogger.debug(
      LogCategory.DATABASE,
      '🔍 Checking for existing dishonest behavior records',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        metadata: {
          questionId,
          lookupType: 'existing_cheat_record',
        },
      },
      'MeetingService',
    );

    const findDishonestEntityByQUestionAndInterviewId =
      await this.dishonestRepository.findByInterviewIdAndQuestionId(
        Number(interviewEntityByCUuid.interviewId),
        questionId,
      );

    this.enhancedLogger.endTimer(
      `db-fetch-dishonest-${interviewEntityByCUuid.interviewId}-${questionId}`,
      LogCategory.DATABASE,
      'Dishonest entity lookup completed',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        metadata: {
          questionId,
          existingRecord: Boolean(findDishonestEntityByQUestionAndInterviewId),
          currentSwitchCount:
            findDishonestEntityByQUestionAndInterviewId?.switchCount || 0,
        },
      },
    );

    const switchCount =
      (Number(findDishonestEntityByQUestionAndInterviewId?.switchCount) || 0) +
      1;

    let severity: string;

    if (switchCount >= 3) {
      severity = 'high';
    } else if (switchCount >= 2) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    this.enhancedLogger.warn(
      LogCategory.INTERVIEW,
      `📊 Cheat counter incremented: ${switchCount} tab switches detected`,
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        metadata: {
          questionId,
          previousCount:
            findDishonestEntityByQUestionAndInterviewId?.switchCount || 0,
          newCount: switchCount,
          increment: 1,
          severity,
        },
      },
      'MeetingService',
    );

    this.enhancedLogger.startTimer(
      `db-save-dishonest-${interviewEntityByCUuid.interviewId}-${questionId}`,
    );

    const isNewRecord = !findDishonestEntityByQUestionAndInterviewId;

    if (isNewRecord) {
      this.enhancedLogger.info(
        LogCategory.DATABASE,
        '💾 Creating new dishonest behavior record',
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          metadata: {
            questionId,
            switchCount,
            recordType: 'new_cheat_record',
          },
        },
        'MeetingService',
      );
    } else {
      this.enhancedLogger.info(
        LogCategory.DATABASE,
        '🔄 Updating existing dishonest behavior record',
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          metadata: {
            questionId,
            oldSwitchCount:
              findDishonestEntityByQUestionAndInterviewId.switchCount,
            newSwitchCount: switchCount,
            recordType: 'update_cheat_record',
          },
        },
        'MeetingService',
      );
    }

    await (!findDishonestEntityByQUestionAndInterviewId
      ? this.dishonestRepository.save(
          this.dishonestRepository.create({
            interview: interviewEntityByCUuid,
            interviewId: interviewEntityByCUuid.interviewId,
            questionId,
            switchCount,
          }),
        )
      : this.dishonestRepository.save({
          ...findDishonestEntityByQUestionAndInterviewId,
          switchCount,
        }));

    this.enhancedLogger.endTimer(
      `db-save-dishonest-${interviewEntityByCUuid.interviewId}-${questionId}`,
      LogCategory.DATABASE,
      `Dishonest behavior record ${
        isNewRecord ? 'created' : 'updated'
      } successfully`,
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        metadata: {
          questionId,
          finalSwitchCount: switchCount,
          operation: isNewRecord ? 'create' : 'update',
        },
      },
    );

    const totalDuration = this.enhancedLogger.endTimer(
      `save-cheating-${scheduleId}-${questionId}`,
      LogCategory.INTERVIEW,
      'Cheat detection logging completed',
      {
        cUuid: String(candidate.cUuid),
        scheduleId,
        interviewId: interviewEntityByCUuid.interviewId.toString(),
        metadata: {
          questionId,
          switchCount,
          cheatType: 'tab_switch',
          operationType: isNewRecord ? 'new_record' : 'update_record',
        },
      },
    );

    if (switchCount >= 3) {
      this.enhancedLogger.error(
        LogCategory.INTERVIEW,
        `🚨 HIGH SEVERITY ALERT: Candidate has ${switchCount} tab switches - possible cheating`,
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          duration: totalDuration,
          metadata: {
            questionId,
            switchCount,
            severity: 'high',
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            recommendedAction: 'flag_for_review',
          },
        },
        'MeetingService',
      );
    } else if (switchCount >= 2) {
      this.enhancedLogger.warn(
        LogCategory.INTERVIEW,
        `⚠️ MEDIUM SEVERITY: ${switchCount} tab switches detected - monitor closely`,
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          duration: totalDuration,
          metadata: {
            questionId,
            switchCount,
            severity: 'medium',
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
          },
        },
        'MeetingService',
      );
    } else {
      this.enhancedLogger.info(
        LogCategory.INTERVIEW,
        `ℹ️ Cheat detection logged successfully - Total processing: ${totalDuration.toFixed(
          2,
        )}ms`,
        {
          cUuid: String(candidate.cUuid),
          scheduleId,
          interviewId: interviewEntityByCUuid.interviewId.toString(),
          duration: totalDuration,
          metadata: {
            questionId,
            switchCount,
            severity: 'low',
            cheatLogged: true,
          },
        },
        'MeetingService',
      );
    }

    return UtilsProvider.getMessageOverviewByType(MessageTypeEnum.TAB_SWITCH);
  }

  @Transactional()
  async sendInvitionToCandidate(
    scheduleId: string,
    inviteToInterviewDto?: InviteToInterviewDto,
  ) {
    const scheduleEntity = await this.scheduleRepository.findById(scheduleId);

    if (scheduleEntity.attendedDatetime) {
      throw new BadRequestException(
        'Interview has already happened, can not move forward',
      );
    }

    const newMeetingLink = this.generateNewMeetingLink();
    const jobTitle = scheduleEntity.job.jobTitle || '';

    const updatedScheduleEntity: Partial<Schedule> = {
      meetingLink: newMeetingLink,
    };

    if (inviteToInterviewDto) {
      updatedScheduleEntity.scheduledDatetime =
        inviteToInterviewDto.scheduledDate;
    }

    await this.scheduleRepository.update(
      scheduleEntity.scheduleId,
      updatedScheduleEntity,
    );
    await this.mailService.send({
      to: scheduleEntity.candidate.email,
      subject: `${
        scheduleEntity.job.manager.company || 'Hire2o'
      } Invites You For An AI Interview `,
      bcc: [scheduleEntity.job.manager.managerEmail],
      html: this.mailService.sendInvitationForAMeeting(
        scheduleEntity.candidate.firstName,
        scheduleEntity.job.manager,
        jobTitle,
        newMeetingLink,
      ),
    });
  }

  async getMeetingByMeetingLink(meetingPostfix: string) {
    const meetingLink = `${this.apiConfigService.frontendUrl}/meeting/${meetingPostfix}`;
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

  /**
   * Get schedule and its associated data by schedule id for "see status" view.
   * Returns schedule details, candidate, job, and derived status (SCHEDULED | IN_PROGRESS | COMPLETED).
   */
  async getScheduleStatusByScheduleId(
    scheduleId: string,
  ): Promise<ScheduleStatusResponseDto> {
    const schedule = await this.scheduleRepository.findById(scheduleId);

    let status: ScheduleStatusEnum = ScheduleStatusEnum.SCHEDULED;

    if (schedule.attendedDatetime) {
      const interview = await this.interviewRepository.findByCUuid(
        String(schedule.cUuid),
      );
      status = interview
        ? ScheduleStatusEnum.COMPLETED
        : ScheduleStatusEnum.IN_PROGRESS;
    }

    const job = schedule.job;
    const manager = job?.manager;
    const candidate = schedule.candidate;

    // Report status: reportMaster by cUuid, reportScores by reportId

    const reportMaster = await this.reportMasterRepository.findByCUuid(
      String(schedule.cUuid),
    );
    let reportStatus: ScheduleStatusResponseDto['reportStatus'];

    // Report status: null when interview not done; COMPLETED/IN_PROGRESS when interview is COMPLETED

    let reportStatusValue: ReportStatusEnum | null = null;

    if (status === ScheduleStatusEnum.COMPLETED) {
      reportStatusValue = reportMaster
        ? ReportStatusEnum.COMPLETED
        : ReportStatusEnum.IN_PROGRESS;
    }

    if (reportMaster) {
      const reportScores = await this.reportScoreRepository.findByReportId(
        reportMaster.reportId,
      );
      const reportUrl = this.s3Service.generatePresignedUrlForEmail(
        reportMaster.reportS3key,
        60 * 60 * 24 * 7,
      );
      reportStatus = {
        status: reportStatusValue,
        reportMaster: {
          reportId: reportMaster.reportId,
          reportS3key: reportMaster.reportS3key,
          reportUrl,
          review: reportMaster.review ?? null,
          createdAt: reportMaster.createdAt,
          updatedAt: reportMaster.updatedAt,
          reportScores: reportScores.map((rs) => ({
            rsId: rs.rsId,
            reportId: rs.reportId,
            ts: rs.ts,
            cs: rs.cs,
            js: rs.js,
            ds: rs.ds,
            reportText: rs.reportText,
            reportRemarks: rs.reportRemarks,
            createdOn: rs.createdOn,
            updatedAt: rs.updatedAt,
          })),
        },
      };
    } else {
      reportStatus = { status: reportStatusValue, reportMaster: null };
    }

    return {
      scheduleId: schedule.scheduleId,
      status,
      scheduledDatetime: schedule.scheduledDatetime,
      meetingLink: schedule.meetingLink,
      attendedDatetime: schedule.attendedDatetime,
      createdOn: schedule.createdOn,
      updatedAt: schedule.updatedAt,
      candidateId: schedule.candidateId,
      cUuid: schedule.cUuid,
      jobId: schedule.jobId,
      jUuid: schedule.jUuid,
      candidate: {
        candidateId: candidate.candidateId,
        cUuid: candidate.cUuid,
        email: candidate.email,
        firstName: candidate.firstName ?? null,
        lastName: candidate.lastName ?? null,
        phoneNo: candidate.phoneNo ?? null,
      },
      job: {
        jobId: job.jobId,
        jUuid: job.jUuid,
        jobTitle: job.jobTitle,
        yearsOfExp: job.yearsOfExp ?? null,
        jobDesc: job.jobDesc ?? null,
        manager: manager
          ? {
              managerId: manager.managerId,
              managerEmail: manager.managerEmail,
              firstName: manager.firstName ?? null,
              lastName: manager.lastName ?? null,
              company: manager.company ?? null,
            }
          : {
              managerId: '',
              managerEmail: '',
              firstName: null,
              lastName: null,
              company: null,
            },
      },
      reportStatus,
    };
  }

  async initiateMultipartUpload(scheduleId: string) {
    const s3Key = `Complete_Interview/${scheduleId}/interview_${Date.now()}.webm`;
    const res = await this.s3Service.createMultipartUpload(s3Key);

    return { uploadId: res.UploadId, s3Key };
  }

  generateNewMeetingLink() {
    const uniqueIdOfMeeting = UtilsProvider.generateUniqueIdOfMeeting();
    const fullPath = `${this.apiConfigService.frontendUrl}/meeting/${uniqueIdOfMeeting}`;

    return fullPath;
  }

  async getManagerInterviewReport(
    getManagerReportDto: GetManagerReportDto,
    managerId: string,
  ): Promise<ManagerReportResponseDto> {
    this.enhancedLogger.logSeparator('MANAGER INTERVIEW REPORT GENERATION');
    this.enhancedLogger.startTimer(`manager-report-${managerId}`);

    try {
      this.enhancedLogger.info(
        LogCategory.API,
        '🚀 Starting manager interview report generation',
        {
          metadata: {
            managerId,
            startDate: getManagerReportDto.startDate,
            endDate: getManagerReportDto.endDate,
            jUuid: getManagerReportDto.jUuid,
            includeHierarchy: getManagerReportDto.includeHierarchy,
            managerJobFilters: getManagerReportDto.managerJobFilters,
          },
        },
        'MeetingService',
      );

      const { startDate, endDate } =
        this.calculateDateRange(getManagerReportDto);
      const filterType = this.determineFilterType(startDate, endDate);

      this.enhancedLogger.info(
        LogCategory.API,
        '📅 Calculated date range and filter type',
        {
          metadata: {
            managerId,
            calculatedStartDate: startDate,
            calculatedEndDate: endDate,
            filterType,
          },
        },
        'MeetingService',
      );

      // Get time savings configuration
      this.enhancedLogger.startTimer(`db-fetch-time-config-${managerId}`);
      const timeConfig = await this.configRepository.getTimeSavingsConfig();
      this.enhancedLogger.endTimer(`db-fetch-time-config-${managerId}`);

      this.enhancedLogger.info(
        LogCategory.API,
        '⚙️ Fetched time savings configuration',
        {
          metadata: {
            managerId,
            timeConfig: timeConfig ? 'loaded' : 'not found',
          },
        },
        'MeetingService',
      );

      // Get schedules for the main manager
      this.enhancedLogger.startTimer(`db-fetch-schedules-${managerId}`);
      const schedules =
        await this.scheduleRepository.findByManagerIdAndDateRange(
          managerId,
          startDate,
          endDate,
          getManagerReportDto.jUuid,
        );
      this.enhancedLogger.endTimer(`db-fetch-schedules-${managerId}`);

      this.enhancedLogger.info(
        LogCategory.API,
        '📋 Fetched schedules for main manager',
        {
          metadata: {
            managerId,
            schedulesCount: schedules.length,
            startDate,
            endDate,
            jUuid: getManagerReportDto.jUuid,
          },
        },
        'MeetingService',
      );

      // Fetch resume data for the main manager
      this.enhancedLogger.startTimer(`db-fetch-resumes-${managerId}`);
      const resumes =
        await this.jobShortlistedProfilesRepository.findByManagerIdAndDateRange(
          managerId,
          startDate,
          endDate,
          getManagerReportDto.jUuid,
        );
      this.enhancedLogger.endTimer(`db-fetch-resumes-${managerId}`);

      this.enhancedLogger.info(
        LogCategory.API,
        '📄 Fetched resume data for main manager',
        {
          metadata: {
            managerId,
            resumesCount: resumes.length,
            startDate,
            endDate,
            jUuid: getManagerReportDto.jUuid,
          },
        },
        'MeetingService',
      );

      this.enhancedLogger.startTimer(`db-fetch-jobs-${managerId}`);
      const allJobsForMainManager = await this.jobsRepository.findByManagerId(
        managerId,
      );
      this.enhancedLogger.endTimer(`db-fetch-jobs-${managerId}`);

      const mainManagerTotalJobsCount = allJobsForMainManager.length;

      this.enhancedLogger.info(
        LogCategory.API,
        '💼 Fetched jobs for main manager',
        {
          metadata: {
            managerId,
            totalJobsCount: mainManagerTotalJobsCount,
          },
        },
        'MeetingService',
      );

      // Generate report parts for the main manager
      this.enhancedLogger.startTimer(`generate-report-parts-${managerId}`);
      const mainManagerParts = this.generateReportParts(
        schedules,
        filterType,
        startDate,
        endDate,
        resumes,
      );
      this.enhancedLogger.endTimer(`generate-report-parts-${managerId}`);

      this.enhancedLogger.info(
        LogCategory.API,
        '📊 Generated report parts for main manager',
        {
          metadata: {
            managerId,
            partsCount: mainManagerParts.length,
            filterType,
          },
        },
        'MeetingService',
      );

      let hierarchicalReports: HierarchicalReportDto[] | undefined;

      // If hierarchical reporting is requested, get data from direct reports
      if (getManagerReportDto.includeHierarchy) {
        this.enhancedLogger.info(
          LogCategory.API,
          '🔄 Hierarchical reporting requested - fetching subordinate data',
          {
            metadata: {
              managerId,
              includeHierarchy: true,
            },
          },
          'MeetingService',
        );

        this.enhancedLogger.startTimer(
          `generate-hierarchical-reports-${managerId}`,
        );
        hierarchicalReports = await this.generateHierarchicalReports(
          managerId,
          startDate,
          endDate,
          getManagerReportDto.jUuid,
          timeConfig,
          getManagerReportDto.managerJobFilters,
        );
        this.enhancedLogger.endTimer(
          `generate-hierarchical-reports-${managerId}`,
        );

        this.enhancedLogger.info(
          LogCategory.API,
          '👥 Generated hierarchical reports',
          {
            metadata: {
              managerId,
              hierarchicalReportsCount: hierarchicalReports?.length || 0,
            },
          },
          'MeetingService',
        );

        // Aggregate data from current manager + all children for the main summary
        this.enhancedLogger.startTimer(`aggregate-data-${managerId}`);
        const aggregatedData = await this.aggregateManagerAndChildrenData(
          managerId,
          startDate,
          endDate,
          getManagerReportDto.jUuid,
          timeConfig,
          getManagerReportDto.managerJobFilters,
        );
        this.enhancedLogger.endTimer(`aggregate-data-${managerId}`);

        this.enhancedLogger.info(
          LogCategory.API,
          '🔗 Aggregated data from manager and subordinates',
          {
            metadata: {
              managerId,
              aggregatedSchedulesCount: aggregatedData.allSchedules.length,
              aggregatedResumesCount: aggregatedData.allResumes.length,
              uniqueJobsCount: aggregatedData.uniqueJobsCount,
            },
          },
          'MeetingService',
        );

        // Create new DTO with aggregated summary
        const aggregatedParts = this.generateReportParts(
          aggregatedData.allSchedules,
          filterType,
          startDate,
          endDate,
          aggregatedData.allResumes,
        );

        this.enhancedLogger.info(
          LogCategory.API,
          '📈 Generated aggregated report parts',
          {
            metadata: {
              managerId,
              aggregatedPartsCount: aggregatedParts.length,
            },
          },
          'MeetingService',
        );

        const totalDuration = this.enhancedLogger.endTimer(
          `manager-report-${managerId}`,
        );

        this.enhancedLogger.success(
          LogCategory.API,
          '✅ Manager interview report generated successfully with hierarchy',
          {
            metadata: {
              managerId,
              totalDuration: totalDuration.toFixed(2),
              totalSchedules: aggregatedData.allSchedules.length,
              totalResumes: aggregatedData.allResumes.length,
              totalJobs: aggregatedData.uniqueJobsCount,
              hierarchicalReportsCount: hierarchicalReports?.length || 0,
            },
          },
          'MeetingService',
        );

        return new ManagerReportResponseDto({
          managerId,
          filterType,
          startDate,
          endDate,
          schedules: aggregatedData.allSchedules, // Use aggregated schedules for parts generation
          parts: aggregatedParts,
          hierarchicalReports,
          timeConfig,
          totalJobsCount: aggregatedData.uniqueJobsCount,
        });
      }

      const totalDuration = this.enhancedLogger.endTimer(
        `manager-report-${managerId}`,
      );

      this.enhancedLogger.success(
        LogCategory.API,
        '✅ Manager interview report generated successfully (no hierarchy)',
        {
          metadata: {
            managerId,
            totalDuration: totalDuration.toFixed(2),
            totalSchedules: schedules.length,
            totalResumes: resumes.length,
            totalJobs: mainManagerTotalJobsCount,
          },
        },
        'MeetingService',
      );

      return new ManagerReportResponseDto({
        managerId,
        filterType,
        startDate,
        endDate,
        schedules,
        parts: mainManagerParts,
        hierarchicalReports,
        timeConfig,
        totalJobsCount: mainManagerTotalJobsCount,
      });
    } catch (error) {
      // Always end the timer, even if an error occurs
      this.enhancedLogger.endTimer(`manager-report-${managerId}`);

      this.enhancedLogger.error(
        LogCategory.API,
        '❌ Error generating manager interview report',
        {
          metadata: {
            managerId,
            error: error.message,
            stack: error.stack,
          },
        },
        'MeetingService',
      );

      throw error; // Re-throw the error
    }
  }

  /**
   * Generate hierarchical reports for a manager and their subordinates
   */
  private async generateHierarchicalReports(
    managerId: string,
    startDate: Date,
    endDate: Date,
    mainJobId?: string,
    timeConfig?: {
      coordHrs: number;
      interviewHrs: number;
      followupHrs: number;
    },
    _managerJobFilters?: Array<{ managerId: string; jUuid?: string }>,
    isTopLevel = true, // New parameter to distinguish top-level vs recursive calls
  ): Promise<HierarchicalReportDto[]> {
    const hierarchicalReports: HierarchicalReportDto[] = [];

    // Ensure we have fallback values for timeConfig
    const safeTimeConfig = timeConfig || {
      coordHrs: 0,
      interviewHrs: 0,
      followupHrs: 0,
    };

    // Only add the main manager's individual data for TOP-LEVEL calls
    if (isTopLevel) {
      const mainManagerSchedules =
        await this.scheduleRepository.findByManagerIdAndDateRange(
          managerId,
          startDate,
          endDate,
          mainJobId,
        );

      // Get main manager resumes
      const mainManagerResumes =
        await this.jobShortlistedProfilesRepository.findByManagerIdAndDateRange(
          managerId,
          startDate,
          endDate,
          mainJobId,
        );

      // Get main manager details
      const mainManager = await this.managerRepository.findById(managerId);

      if (!mainManager) {
        throw new NotFoundException(`Manager with ID ${managerId} not found`);
      }

      const mainManagerTotalInvitesShared = mainManagerSchedules.length;
      const mainManagerTotalInterviewsAttended = mainManagerSchedules.filter(
        (s) => s.attendedDatetime,
      ).length;

      const mainManagerTimeSaved =
        (safeTimeConfig.coordHrs || 0) * mainManagerTotalInvitesShared +
        (safeTimeConfig.interviewHrs || 0) *
          mainManagerTotalInterviewsAttended +
        (safeTimeConfig.followupHrs || 0) * mainManagerTotalInvitesShared;

      // Get all jobs for the main manager
      const allJobsForMainManager = await this.jobsRepository.findByManagerId(
        managerId,
      );

      const mainManagerTotalJobsCount = allJobsForMainManager.length;

      // Generate report parts for the main manager
      const filterType = this.determineFilterType(startDate, endDate);
      const mainManagerParts = this.generateReportParts(
        mainManagerSchedules,
        filterType,
        startDate,
        endDate,
        mainManagerResumes,
      );

      // Add main manager's individual data
      hierarchicalReports.push({
        managerId,
        managerEmail: mainManager.managerEmail,
        firstName: mainManager.firstName || '',
        lastName: mainManager.lastName || '',
        summary: {
          totalInvitesShared: mainManagerTotalInvitesShared,
          totalInterviewsAttended: mainManagerTotalInterviewsAttended,
          timeSaved: Math.round(mainManagerTimeSaved * 100) / 100,
          totalResumesUploaded: mainManagerResumes.length,
          uniqueJobsCount: mainManagerTotalJobsCount,
        },
        parts: mainManagerParts,
        subReports: undefined, // Main manager doesn't have sub-reports at this level
      });
    }

    // Get all direct reports for this manager
    const directReports =
      await this.managerRelationshipRepository.findByReportsToManagerId(
        managerId,
      );

    for (const report of directReports) {
      // Get schedules for this direct report
      const schedules =
        await this.scheduleRepository.findByManagerIdAndDateRange(
          report.managerId,
          startDate,
          endDate,
          mainJobId,
        );

      // Get resumes for this direct report
      const resumes =
        await this.jobShortlistedProfilesRepository.findByManagerIdAndDateRange(
          report.managerId,
          startDate,
          endDate,
          mainJobId,
        );

      // Generate report parts for this manager
      const filterType = this.determineFilterType(startDate, endDate);
      const parts = this.generateReportParts(
        schedules,
        filterType,
        startDate,
        endDate,
        resumes,
      );

      // Calculate summary for this manager
      const totalInvitesShared = schedules.length;
      const totalInterviewsAttended = schedules.filter(
        (s) => s.attendedDatetime,
      ).length;

      const timeSaved =
        (safeTimeConfig.coordHrs || 0) * totalInvitesShared +
        (safeTimeConfig.interviewHrs || 0) * totalInterviewsAttended +
        (safeTimeConfig.followupHrs || 0) * totalInvitesShared;

      // Get all jobs for this manager (not just from schedules)
      const allJobsForManager = await this.jobsRepository.findByManagerId(
        report.managerId,
      );

      const totalJobsCount = allJobsForManager.length;

      // Recursively get sub-reports for this manager (NOT top-level)
      const subReports = await this.generateHierarchicalReports(
        report.managerId,
        startDate,
        endDate,
        mainJobId,
        safeTimeConfig,
        _managerJobFilters,
        false, // This is NOT a top-level call
      );

      hierarchicalReports.push({
        managerId: report.managerId,
        managerEmail: report.manager.managerEmail,
        firstName: report.manager.firstName || '',
        lastName: report.manager.lastName || '',
        summary: {
          totalInvitesShared,
          totalInterviewsAttended,
          timeSaved: Math.round(timeSaved * 100) / 100,
          totalResumesUploaded: resumes.length,
          uniqueJobsCount: totalJobsCount,
        },
        parts,
        subReports: subReports.length > 0 ? subReports : undefined,
      });
    }

    return hierarchicalReports;
  }

  private async aggregateManagerAndChildrenData(
    managerId: string,
    startDate: Date,
    endDate: Date,
    mainJobId?: string,
    timeConfig?: {
      coordHrs: number;
      interviewHrs: number;
      followupHrs: number;
    },
    _managerJobFilters?: Array<{ managerId: string; jUuid?: string }>,
  ): Promise<{
    allSchedules: Schedule[];
    allResumes: Array<{ createdOn: string | number | Date }>; // JobShortlistedProfiles[]
    totalInvitesShared: number;
    totalInterviewsAttended: number;
    timeSaved: number;
    uniqueJobsCount: number;
  }> {
    const allSchedules: Schedule[] = [];
    const allResumes: Array<{ createdOn: string | number | Date }> = []; // JobShortlistedProfiles[]
    const allJobs: Array<{ jUuid: string; jobTitle: string }> = [];

    // Ensure we have fallback values for timeConfig
    const safeTimeConfig = timeConfig || {
      coordHrs: 0,
      interviewHrs: 0,
      followupHrs: 0,
    };

    // Recursive function to collect all managers in the hierarchy
    const collectAllManagersInHierarchy = async (
      currentManagerId: string,
    ): Promise<void> => {
      // Get schedules for current manager
      const managerSchedules =
        await this.scheduleRepository.findByManagerIdAndDateRange(
          currentManagerId,
          startDate,
          endDate,
          mainJobId,
        );
      allSchedules.push(...managerSchedules);

      // Get resumes for current manager
      const managerResumes =
        await this.jobShortlistedProfilesRepository.findByManagerIdAndDateRange(
          currentManagerId,
          startDate,
          endDate,
          mainJobId,
        );
      allResumes.push(...managerResumes);

      // Get ALL jobs for current manager
      const managerJobs = await this.jobsRepository.findByManagerId(
        currentManagerId,
      );
      allJobs.push(
        ...managerJobs.map((job) => ({
          jUuid: job.jUuid,
          jobTitle: job.jobTitle || '',
        })),
      );

      // Get direct reports of current manager
      const directReports =
        await this.managerRelationshipRepository.findByReportsToManagerId(
          currentManagerId,
        );

      // Recursively collect data from all direct reports
      for (const report of directReports) {
        await collectAllManagersInHierarchy(report.managerId);
      }
    };

    // Start recursive collection from the main manager
    await collectAllManagersInHierarchy(managerId);

    // Remove duplicate jobs based on jobId
    const uniqueJobs = allJobs.filter(
      (job, index, self) =>
        index === self.findIndex((j) => j.jUuid === job.jUuid),
    );

    const totalInvitesShared = allSchedules.length;
    const totalInterviewsAttended = allSchedules.filter(
      (s) => s.attendedDatetime,
    ).length;
    const timeSaved =
      (safeTimeConfig.coordHrs || 0) * totalInvitesShared +
      (safeTimeConfig.interviewHrs || 0) * totalInterviewsAttended +
      (safeTimeConfig.followupHrs || 0) * totalInvitesShared;

    return {
      allSchedules,
      allResumes,
      totalInvitesShared,
      totalInterviewsAttended,
      timeSaved,
      uniqueJobsCount: uniqueJobs.length,
    };
  }

  private calculateDateRange(dto: GetManagerReportDto): {
    startDate: Date;
    endDate: Date;
  } {
    // Fix for timezone handling: Normalize all dates to UTC to ensure consistent
    // database queries with 'timestamp without time zone' columns
    // Parse the start date and normalize to start of day in UTC
    const startDate = new Date(dto.startDate);
    // Ensure we're working with the start of the day in UTC
    startDate.setUTCHours(0, 0, 0, 0);

    let endDate: Date;

    if (dto.endDate) {
      // If endDate is provided, use it
      endDate = new Date(dto.endDate);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      // If no endDate provided, assume it's the same day
      endDate = new Date(startDate);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  private determineFilterType(
    startDate: Date,
    endDate: Date,
  ): ReportFilterType {
    // Check if it's a full year (Jan 1 to Dec 31 of same year)
    if (
      startDate.getUTCMonth() === 0 && // January
      startDate.getUTCDate() === 1 && // 1st day
      endDate.getUTCMonth() === 11 && // December
      endDate.getUTCDate() === 31 && // 31st day
      startDate.getUTCFullYear() === endDate.getUTCFullYear() // Same year
    ) {
      return ReportFilterType.YEAR;
    }

    // Check if it's a full month (1st to last day of same month)
    if (
      startDate.getUTCDate() === 1 && // First day of month
      startDate.getUTCFullYear() === endDate.getUTCFullYear() && // Same year
      startDate.getUTCMonth() === endDate.getUTCMonth() // Same month
    ) {
      const daysInMonth = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0),
      ).getUTCDate();

      if (endDate.getUTCDate() === daysInMonth) {
        return ReportFilterType.MONTH;
      }
    }

    // Check for exact week (7 days)
    const diffInMs = endDate.getTime() - startDate.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 6) {
      // 6 days difference means 7 days total (inclusive)
      return ReportFilterType.WEEK;
    }

    // Otherwise, it's custom

    return ReportFilterType.CUSTOM;
  }

  private generateReportParts(
    schedules: Schedule[],
    filterType: ReportFilterType,
    startDate: Date,
    endDate: Date,
    resumes?: Array<{ createdOn: string | number | Date }>, // JobShortlistedProfiles array
  ): ReportPartDto[] {
    const parts: ReportPartDto[] = [];

    switch (filterType) {
      case ReportFilterType.YEAR: {
        const currentDate = new Date();
        const endOfReport = endDate < currentDate ? endDate : currentDate;

        // Only generate months up to current date or report end date
        const endMonth =
          endOfReport.getUTCFullYear() === startDate.getUTCFullYear()
            ? endOfReport.getUTCMonth()
            : 11; // If different year, go to December

        for (let month = startDate.getUTCMonth(); month <= endMonth; month++) {
          // Use UTC to ensure consistent timezone handling
          const monthStart = new Date(
            Date.UTC(startDate.getUTCFullYear(), month, 1),
          );
          const monthEnd = new Date(
            Date.UTC(startDate.getUTCFullYear(), month + 1, 0, 23, 59, 59, 999),
          );

          const monthSchedules = schedules.filter((s) => {
            const scheduleDate = new Date(s.scheduledDatetime);

            return scheduleDate >= monthStart && scheduleDate <= monthEnd;
          });

          const monthResumes = (resumes || []).filter((r) => {
            const resumeDate = new Date(r.createdOn);

            return resumeDate >= monthStart && resumeDate <= monthEnd;
          });

          parts.push({
            label: monthStart.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            }),
            startDate: monthStart,
            endDate: monthEnd,
            scheduledCount: monthSchedules.length,
            attendedCount: monthSchedules.filter((s) => s.attendedDatetime)
              .length,
            resumesUploadedCount: monthResumes.length,
          });
        }

        break;
      }

      case ReportFilterType.MONTH: {
        const weeksInMonth = Math.ceil(
          (endDate.getTime() - startDate.getTime()) /
            TIME_CONSTANTS.MILLISECONDS_PER_WEEK,
        );

        for (let week = 0; week < weeksInMonth; week++) {
          const weekStart = new Date(startDate);
          weekStart.setUTCDate(startDate.getUTCDate() + week * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
          weekEnd.setUTCHours(23, 59, 59, 999);

          if (weekEnd > endDate) {
            weekEnd.setTime(endDate.getTime());
          }

          const weekSchedules = schedules.filter((s) => {
            const scheduleDate = new Date(s.scheduledDatetime);

            return scheduleDate >= weekStart && scheduleDate <= weekEnd;
          });

          const weekResumes = (resumes || []).filter((r) => {
            const resumeDate = new Date(r.createdOn);

            return resumeDate >= weekStart && resumeDate <= weekEnd;
          });

          parts.push({
            label: `Week ${week + 1}`,
            startDate: weekStart,
            endDate: weekEnd,
            scheduledCount: weekSchedules.length,
            attendedCount: weekSchedules.filter((s) => s.attendedDatetime)
              .length,
            resumesUploadedCount: weekResumes.length,
          });
        }

        break;
      }

      case ReportFilterType.WEEK: {
        for (let day = 0; day < 7; day++) {
          const dayStart = new Date(startDate);
          dayStart.setUTCDate(startDate.getUTCDate() + day);
          dayStart.setUTCHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setUTCHours(23, 59, 59, 999);

          const daySchedules = schedules.filter((s) => {
            const scheduleDate = new Date(s.scheduledDatetime);

            return scheduleDate >= dayStart && scheduleDate <= dayEnd;
          });

          const dayResumes = (resumes || []).filter((r) => {
            const resumeDate = new Date(r.createdOn);

            return resumeDate >= dayStart && resumeDate <= dayEnd;
          });

          parts.push({
            label: DAY_NAMES[dayStart.getUTCDay()],
            startDate: dayStart,
            endDate: dayEnd,
            scheduledCount: daySchedules.length,
            attendedCount: daySchedules.filter((s) => s.attendedDatetime)
              .length,
            resumesUploadedCount: dayResumes.length,
          });
        }

        break;
      }

      case ReportFilterType.CUSTOM: {
        const currentDate = new Date();
        const effectiveEndDate = endDate < currentDate ? endDate : currentDate;

        const totalDays = Math.ceil(
          (effectiveEndDate.getTime() - startDate.getTime()) /
            TIME_CONSTANTS.MILLISECONDS_PER_DAY,
        );

        if (totalDays <= REPORT_BREAKDOWNS.DAYS_THRESHOLD_FOR_DAILY) {
          // Daily breakdown
          for (let day = 0; day < totalDays; day++) {
            const dayStart = new Date(startDate);
            dayStart.setUTCDate(startDate.getUTCDate() + day);
            dayStart.setUTCHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setUTCHours(23, 59, 59, 999);

            const daySchedules = schedules.filter((s) => {
              const scheduleDate = new Date(s.scheduledDatetime);

              return scheduleDate >= dayStart && scheduleDate <= dayEnd;
            });

            const dayResumes = (resumes || []).filter((r) => {
              const resumeDate = new Date(r.createdOn);

              return resumeDate >= dayStart && resumeDate <= dayEnd;
            });

            parts.push({
              label: dayStart.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              }),
              startDate: dayStart,
              endDate: dayEnd,
              scheduledCount: daySchedules.length,
              attendedCount: daySchedules.filter((s) => s.attendedDatetime)
                .length,
              resumesUploadedCount: dayResumes.length,
            });
          }
        } else if (totalDays <= REPORT_BREAKDOWNS.DAYS_THRESHOLD_FOR_WEEKLY) {
          // Weekly breakdown
          const weeksInRange = Math.ceil(totalDays / 7);

          for (let week = 0; week < weeksInRange; week++) {
            const weekStart = new Date(startDate);
            weekStart.setUTCDate(startDate.getUTCDate() + week * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
            weekEnd.setUTCHours(23, 59, 59, 999);

            if (weekEnd > effectiveEndDate) {
              weekEnd.setTime(effectiveEndDate.getTime());
            }

            const weekSchedules = schedules.filter((s) => {
              const scheduleDate = new Date(s.scheduledDatetime);

              return scheduleDate >= weekStart && scheduleDate <= weekEnd;
            });

            const weekResumes = (resumes || []).filter((r) => {
              const resumeDate = new Date(r.createdOn);

              return resumeDate >= weekStart && resumeDate <= weekEnd;
            });

            parts.push({
              label: `Week ${week + 1}`,
              startDate: weekStart,
              endDate: weekEnd,
              scheduledCount: weekSchedules.length,
              attendedCount: weekSchedules.filter((s) => s.attendedDatetime)
                .length,
              resumesUploadedCount: weekResumes.length,
            });
          }
        } else {
          // Monthly breakdown
          let currentMonth = new Date(startDate);
          currentMonth.setUTCDate(1);
          currentMonth.setUTCHours(0, 0, 0, 0);

          while (currentMonth <= effectiveEndDate) {
            const monthEnd = new Date(
              Date.UTC(
                currentMonth.getUTCFullYear(),
                currentMonth.getUTCMonth() + 1,
                0,
                23,
                59,
                59,
                999,
              ),
            );

            // For the first month, use the actual startDate if it's not the 1st
            const monthStart = new Date(currentMonth);

            if (
              currentMonth.getUTCFullYear() === startDate.getUTCFullYear() &&
              currentMonth.getUTCMonth() === startDate.getUTCMonth()
            ) {
              monthStart.setTime(startDate.getTime());
            }

            // For the last month, use the effective end date if it's before month end
            const actualMonthEnd =
              monthEnd > effectiveEndDate
                ? new Date(effectiveEndDate.getTime())
                : monthEnd;

            const monthSchedules = schedules.filter((s) => {
              const scheduleDate = new Date(s.scheduledDatetime);

              return (
                scheduleDate >= monthStart && scheduleDate <= actualMonthEnd
              );
            });

            const monthResumes = (resumes || []).filter((r) => {
              const resumeDate = new Date(r.createdOn);

              return resumeDate >= monthStart && resumeDate <= actualMonthEnd;
            });

            parts.push({
              label: currentMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              }),
              startDate: monthStart,
              endDate: actualMonthEnd,
              scheduledCount: monthSchedules.length,
              attendedCount: monthSchedules.filter((s) => s.attendedDatetime)
                .length,
              resumesUploadedCount: monthResumes.length,
            });

            // Move to next month
            currentMonth = new Date(
              Date.UTC(
                currentMonth.getUTCFullYear(),
                currentMonth.getUTCMonth() + 1,
                1,
                0,
                0,
                0,
                0,
              ),
            );
          }
        }

        break;
      }
    }

    return parts;
  }
}
