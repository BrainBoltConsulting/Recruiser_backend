import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import { Role } from '../../constants/role.enum';
import { TokenTypeEnum } from '../../constants/token-type.enum';
import type { Candidate } from '../../entities/Candidate';
import { UtilsProvider } from '../../providers/utils.provider';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { DishonestRepository } from '../../repositories/DishonestRepository';
import { EvaluationRepository } from '../../repositories/EvaluationRepository';
import { InterviewRepository } from '../../repositories/InterviewRepository';
import { LoginRepository } from '../../repositories/LoginRepository';
import { ScheduleRepository } from '../../repositories/ScheduleRepository';
import { S3Service } from '../../shared/services/aws-s3.service';
import { MailService } from '../../shared/services/mail.service';
import { UrlService } from '../../shared/services/url.service';
import type { RegistrationDto } from '../auth/dtos/registration.dto';
import { UserUnauthenticatedException } from '../auth/exceptions/user-unauthenticated.exception';
import { JwtStrategy } from '../auth/jwt.strategy';
import { UserTokenService } from '../auth/user-token.service';
import { UserDto } from '../common/modules/user/user.dto';
import { MeetingService } from '../meeting/meeting.service';
import { SkillService } from '../skill/skill.service';
import type { GetUsersDto } from './dtoes/get-users.dto';
import { UpdatePasswordDto } from './dtoes/update-password.dto';
import { UpdateUserDto } from './dtoes/update-user.dto';
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

    public readonly loginRepository: LoginRepository,
    public readonly meetingService: MeetingService,
    public readonly s3Service: S3Service,
    public readonly mailService: MailService,
    private readonly jwtService: JwtStrategy,
    public readonly userTokenService: UserTokenService,
    public readonly urlService: UrlService,
  ) {}

  @Transactional()
  async create(data: Partial<RegistrationDto>) {
    try {
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
        data.skillId,
        entity.candidateId,
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

  async getEntityById(id: string, withoutException?: boolean) {
    const entity = await this.candidateRepository.findById(id);

    if (!entity && !withoutException) {
      throw new UserNotFoundException();
    }

    return entity;
  }

  @Transactional()
  async sendInvitationViaEmail(email: string): Promise<void> {
    const userByEmail = await this.candidateRepository.findByEmail(email);

    if (!userByEmail) {
      throw new UserNotFoundException();
    }

    const token = this.jwtService.generateToken({
      payload: {
        id: userByEmail.candidateId,
        user: userByEmail,
        // user: userByEmail.toDto({isAccess: true}),
        type: TokenTypeEnum.SET_PASSWORD,
      },
    });

    await this.userTokenService.upsert({
      token,
      userId: userByEmail.candidateId,
      type: TokenTypeEnum.SET_PASSWORD,
    });

    // await this.mailService.send({
    //   to: userByEmail.email,
    //   subject: "You're Invited! Join Your Meeting on Canint",
    //   // tmp solution
    //   html: this.mailService.sendInvitationForAMeeting(userByEmail.firstName, "userByEmail", ),
    // });
  }

  async getUserById(id: number) {
    const entity = await this.candidateRepository.findByCandidateId(id);

    //return entity.toDto();
    return entity;
  }

  @Transactional()
  async updateUser(id: number, user: UserDto, updateUserDto: UpdateUserDto) {
    if (Object.keys(updateUserDto).length > 0) {
      await this.candidateRepository.update(id, {
        firstName: user.firstName,
      });
    }

    return this.candidateRepository.findByCandidateId(id);

    // return (await this.candidateRepository.findById(id)).toDto({isAccess: true});
  }

  async getAllUsers(getUsersDto: GetUsersDto): Promise<Candidate[]> {
    const userEntitiesQuery = await this.candidateRepository.getAllSorted();

    // const [userEntities, pageMetaDto] = await userEntitiesQuery.paginate(
    //   getUsersDto
    // );

    return userEntitiesQuery;
  }

  @Transactional()
  async updateUserPassword(
    id: string,
    user: UserDto,
    body: UpdatePasswordDto,
  ): Promise<void> {
    if (id !== user.id) {
      throw new ForbiddenException();
    }

    const userEntity = await this.getEntityByEmail(user.email);

    await this.validateUserPassword(userEntity, body.oldPassword);

    if (body.newPassword !== body.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (body.oldPassword === body.newPassword) {
      throw new BadRequestException(
        'New password cannot be the same as old password',
      );
    }

    // await this.addOrResetPassword(id, body.newPassword);
  }

  async validateUserPassword(userEntity: Candidate, password: string) {
    const isPasswordValid = await UtilsProvider.validateHash(
      password,
      // tmp solution
      'userEntity.password',
    );

    if (!isPasswordValid) {
      throw new UserUnauthenticatedException('password is an invalid');
    }

    return userEntity;
  }

  async getCandidatesInterviews(candidateId: number) {
    await this.candidateRepository.findByCandidateId(candidateId);

    return this.meetingService.getInterviewsOfCandidate(candidateId);
  }

  @Transactional()
  async deleteUser(id: number): Promise<void> {
    await this.candidateRepository.findByCandidateId(id);
    await this.candidateRepository.delete(id);
  }

  async getCandidateWithLoginData(email: string) {
    const candidateEntity = await this.candidateRepository.getWithLoginData(
      email,
    );

    return candidateEntity;
  }

  @Transactional()
  async deleteCandidateInterviews(id: number) {
    await this.candidateRepository.findByCandidateId(id);

    const interviews =
      await this.interviewRepository.findAllInterviewsByCandidateId(id);

    for (const interview of interviews) {
      if (interview.evaluations?.length) {
        // eslint-disable-next-line no-await-in-loop
        await this.evaluationRepository.delete(
          interview.evaluations.map((ev) => ev.evaluationId),
        );
      }

      if (interview.dishonests?.length) {
        // eslint-disable-next-line no-await-in-loop
        await this.dishonestRepository.delete(
          interview.dishonests.map((dis) => dis.dishonestId),
        );
      }

      // eslint-disable-next-line no-await-in-loop
      await this.interviewRepository.delete(interview.interviewId);
    }

    return interviews;
  }
}
