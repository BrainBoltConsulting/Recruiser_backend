import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { Transactional } from 'typeorm-transactional';

import { Role } from '../../constants/role.enum';
import type { Candidate } from '../../entities/Candidate';
import type { Manager } from '../../entities/Manager';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { CommunicationScoresRepository } from '../../repositories/CommunicationScoresRepository';
import { DishonestRepository } from '../../repositories/DishonestRepository';
import { DishonestSsRepository } from '../../repositories/DishonestSsRepository';
import { EmotionScoreRepository } from '../../repositories/EmotionScoreRepository';
import { EvaluationRepository } from '../../repositories/EvaluationRepository';
import { InterviewRepository } from '../../repositories/InterviewRepository';
import { LoginRepository } from '../../repositories/LoginRepository';
import { ScheduleRepository } from '../../repositories/ScheduleRepository';
import { TechnicalScoresRepository } from '../../repositories/TechnicalScoresRepository';
import { VocabScoreRepository } from '../../repositories/VocabScoreRepository';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { MailService } from '../../shared/services/mail.service';
import type { RegistrationDto } from '../auth/dtos/registration.dto';
import { SkillService } from '../skill/skill.service';
import { UserNotFoundException } from './exceptions/user-not-found.exception';

@Injectable()
export class CandidateService {
  constructor(
    public readonly skillService: SkillService,
    public readonly candidateRepository: CandidateRepository,
    public readonly dishonestRepository: DishonestRepository,
    public readonly evaluationRepository: EvaluationRepository,
    public readonly scheduleRepository: ScheduleRepository,
    public readonly interviewRepository: InterviewRepository,
    public readonly emotionScoreRepository: EmotionScoreRepository,
    public readonly communicationScoresRepository: CommunicationScoresRepository,
    public readonly technicalScoresRepository: TechnicalScoresRepository,
    public readonly vocabScoreRepository: VocabScoreRepository,
    public readonly dishonestSsRepository: DishonestSsRepository,
    public readonly loginRepository: LoginRepository,
    public readonly mailService: MailService,
    private readonly apiConfigService: ApiConfigService,
  ) {}

  @Transactional()
  async create(data: Partial<RegistrationDto>) {
    try {
      if (typeof data.skillId !== 'number' || Number.isNaN(data.skillId)) {
        throw new BadRequestException('skillId is required');
      }

      const skillId: number = data.skillId;

      const loginEntity = await this.loginRepository.save(
        this.loginRepository.create({
          loginUsername: data.email,
          loginPassword: data.password,
          role: Role.CANDIDATE,
          email: data.email,
        }),
      );

      const candidateEntityToSave = this.candidateRepository.create({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        login: loginEntity,
        loginId: loginEntity.loginId,
      });

      const entity = await this.candidateRepository.save({
        ...candidateEntityToSave,
      });

      await this.skillService.createSkillForCadidate(
        skillId,
        String(entity.cUuid),
      );

      return entity;
    } catch (error) {
      console.warn(error);

      throw new BadRequestException();
    }
  }

  async getEntityByEmail(email: string, withoutException?: boolean) {
    const entity = await this.candidateRepository.findByEmail(email);

    if (!entity && !withoutException) {
      throw new UserNotFoundException();
    }

    return entity;
  }

  async getCandidateWithLoginData(email: string) {
    const candidateEntity = await this.candidateRepository.getWithLoginData(
      email,
    );

    return candidateEntity;
  }

  @Transactional()
  async deleteCandidateInterviews(cUuid: string) {
    await this.candidateRepository.findByCUuid(cUuid);

    const interviews = await this.interviewRepository.findAllInterviewsByCUuid(
      cUuid,
    );

    for (const interview of interviews) {
      if (interview.evaluations?.length) {
        // First delete all score-related data associated with these evaluations
        const evaluationIds: string[] = interview.evaluations.map(
          (ev) => ev.evaluationId,
        );

        // Delete emotion scores
        // eslint-disable-next-line no-await-in-loop
        await this.emotionScoreRepository
          .createQueryBuilder()
          .delete()
          .where('evaluation_id IN (:...evaluationIds)', { evaluationIds })
          .execute();

        // Delete communication scores
        // eslint-disable-next-line no-await-in-loop
        await this.communicationScoresRepository
          .createQueryBuilder()
          .delete()
          .where('evaluation_id IN (:...evaluationIds)', { evaluationIds })
          .execute();

        // Delete technical scores
        // eslint-disable-next-line no-await-in-loop
        await this.technicalScoresRepository
          .createQueryBuilder()
          .delete()
          .where('evaluation_id IN (:...evaluationIds)', { evaluationIds })
          .execute();

        // Delete dishonest_ss records
        // eslint-disable-next-line no-await-in-loop
        await this.dishonestSsRepository
          .createQueryBuilder()
          .delete()
          .where('evaluation_id IN (:...evaluationIds)', { evaluationIds })
          .execute();

        // Then delete the evaluations
        // eslint-disable-next-line no-await-in-loop
        await this.evaluationRepository.delete(evaluationIds);
      }

      if (interview.dishonests?.length) {
        const dishonestIds: string[] = interview.dishonests.map(
          (dis) => dis.dishonestId,
        );
        // eslint-disable-next-line no-await-in-loop
        await this.dishonestRepository.delete(dishonestIds);
      }

      // Delete vocab scores associated with this interview
      // eslint-disable-next-line no-await-in-loop
      await this.vocabScoreRepository
        .createQueryBuilder()
        .delete()
        .where('interview_id = :interviewId', {
          interviewId: interview.interviewId,
        })
        .execute();

      // Finally delete the interview
      // eslint-disable-next-line no-await-in-loop
      await this.interviewRepository.delete({
        interviewId: interview.interviewId,
      });
    }

    return interviews;
  }

  private getInterviewCompletionNotificationHtml(
    candidateManagerData: Candidate,
    manager: Manager,
  ): string {
    const firstName = candidateManagerData.firstName || '';
    const middleName = candidateManagerData.middleName;
    const lastName = candidateManagerData.lastName || '';

    return this.mailService.sendInterviewCompletionNotification(
      String(firstName),
      middleName == null ? null : String(middleName),
      String(lastName),
      candidateManagerData.cUuid,
      {
        managerEmail: String(manager.managerEmail),
        firstName: manager.firstName == null ? null : String(manager.firstName),
        middleName:
          manager.middleName == null ? null : String(manager.middleName),
        lastName: manager.lastName == null ? null : String(manager.lastName),
        company: manager.company == null ? null : String(manager.company),
        logoS3key: manager.logoS3key == null ? null : String(manager.logoS3key),
      },
    );
  }

  @Transactional()
  async sendInterviewCompletionNotificationToManager(
    cUuid: string,
  ): Promise<void> {
    try {
      const candidateManagerData =
        await this.candidateRepository.findManagerByCUuid(cUuid);

      if (!candidateManagerData) {
        throw new UserNotFoundException();
      }

      const manager = candidateManagerData.jobShortlistedProfiles[0].manager;

      if (!manager.managerEmail || manager.managerEmail.trim() === '') {
        throw new BadRequestException(
          'Manager email not found for this candidate',
        );
      }

      const firstName = candidateManagerData.firstName || '';
      const middleName = candidateManagerData.middleName;
      const lastName = candidateManagerData.lastName || '';
      const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(' ');
      const displayName =
        fullName || `Candidate ${candidateManagerData.cUuid} (c_uuid)`;
      const subject = `Interview Completion Notification – ${displayName} (Candidate ID: ${candidateManagerData.cUuid} (c_uuid))`;

      const html = this.getInterviewCompletionNotificationHtml(
        candidateManagerData,
        manager,
      );

      await this.mailService.send({
        to: String(manager.managerEmail),
        subject,
        html,
      });

      // Notify assessment/Greenhouse that the test is completed (internal resources)
      await this.notifyAssessmentMarkCompleted(cUuid);
    } catch (error) {
      if (
        error instanceof UserNotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Error sending interview completion notification:', error);

      throw new InternalServerErrorException(
        'Failed to send interview completion notification',
      );
    }
  }

  /**
   * Notifies the assessment/Greenhouse API that the test is completed (PATCH mark_completed).
   * Uses scheduleId from the schedule table for this candidate (most recent schedule).
   * Does not throw: failures are logged but do not affect the main notification flow.
   */
  private async notifyAssessmentMarkCompleted(cUuid: string): Promise<void> {
    const { baseUrl, username, password } =
      this.apiConfigService.assessmentConfig;

    if (!baseUrl?.trim()) {
      return;
    }

    const schedules = await this.scheduleRepository.findByCUuid(cUuid);

    if (!schedules?.length) {
      console.warn(
        `[notifyAssessmentMarkCompleted] No schedule found for cUuid=${cUuid}, skipping assessment API call`,
      );

      return;
    }

    const mostRecent = [...schedules].sort(
      (a, b) =>
        new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime(),
    )[0];
    const scheduleId = mostRecent.scheduleId;

    const url = `${baseUrl.replace(
      /\/$/,
      '',
    )}/assessment/mark_completed/${scheduleId}`;

    const auth = username
      ? Buffer.from(`${username}:${password ?? ''}`, 'utf-8').toString('base64')
      : '';

    try {
      const response = await axios.patch(url, undefined, {
        timeout: 15_000,
        headers: auth ? { Authorization: `Basic ${auth}` } : {},
        validateStatus: () => true,
      });

      if (response.status !== 204) {
        console.warn(
          `[notifyAssessmentMarkCompleted] Assessment API returned ${response.status} for cUuid=${cUuid}, scheduleId=${scheduleId}`,
        );
      }
    } catch (error) {
      console.error(
        `[notifyAssessmentMarkCompleted] Assessment API call failed for cUuid=${cUuid}, scheduleId=${scheduleId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}
