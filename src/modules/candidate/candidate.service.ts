import { MeetingService } from './../meeting/meeting.service';
import { LoginRepository } from './../../repositories/LoginRepository';
import { SkillService } from './../skill/skill.service';
import { RegistrationDto } from './../auth/dtos/registration.dto';
import { Candidate } from '../../entities/Candidate';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { UserDto } from '../common/modules/user/user.dto';
import { MailService } from '../../shared/services/mail.service';
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { Role } from '../../constants/role.enum';
import { UtilsProvider } from '../../providers/utils.provider';
import { S3Service } from '../../shared/services/aws-s3.service';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UserTokenService } from '../auth/user-token.service';
import { TokenTypeEnum } from '../../constants/token-type.enum';
import { UrlService } from '../../shared/services/url.service';
import { UpdateUserDto } from './dtoes/update-user.dto';
import { UpdatePasswordDto } from './dtoes/update-password.dto';
import { UserUnauthenticatedException } from '../auth/exceptions/user-unauthenticated.exception';
import { JwtStrategy } from '../auth/jwt.strategy';
import { GetUsersDto } from './dtoes/get-users.dto';

@Injectable()
export class CandidateService {
  constructor(
    public readonly skillService: SkillService,
    public readonly candidateRepository: CandidateRepository,
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
      const loginEntity  = await this.loginRepository.save(this.loginRepository.create({
        loginUsername: data.email,
        loginPassword: data.password,
        role: Role.CANDIDATE,
        email: data.email
      }));

      const candidateEntityToSave = this.candidateRepository.create({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        login: loginEntity,
        loginId: loginEntity.loginId
      });

      const entity = await this.candidateRepository.save({
        ...candidateEntityToSave,
      });

      await this.skillService.createSkillForCadidate(data.skillId, entity.candidateId);

      return entity;
    } catch (error) {
      console.log(error)
      throw new BadRequestException()
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
      throw new UserNotFoundException()
    }

    const token = this.jwtService.generateToken({
      payload: {
        id: userByEmail.candidateId,
        user: userByEmail,
        // user: userByEmail.toDto({isAccess: true}),
        type: TokenTypeEnum.SET_PASSWORD,
      },
    })

    await this.userTokenService.upsert({
      token,
      userId: userByEmail.candidateId,
      type: TokenTypeEnum.SET_PASSWORD
    })

    // await this.mailService.send({
    //   to: userByEmail.email,
    //   subject: "You're Invited! Join Your Meeting on Canint",
    //   // tmp solution
    //   html: this.mailService.sendInvitationForAMeeting(userByEmail.firstName, "userByEmail", ),
    // });  
  }

  async getUserById(id: number) {
    const entity = await this.candidateRepository.findByUserId(id);
    
    //return entity.toDto();
    return entity;
  }
 
  @Transactional()
  async updateUser(id: number, user: UserDto, updateUserDto: UpdateUserDto) {

    if (Object.keys(updateUserDto).length) {
      await this.candidateRepository.update(id, {
        firstName: user.firstName
      });
    }

    return (await this.candidateRepository.findByUserId(id));

    // return (await this.candidateRepository.findById(id)).toDto({isAccess: true});
  }

  async getAllUsers(getUsersDto: GetUsersDto): Promise<Candidate[]> {
    let userEntitiesQuery = await this.candidateRepository.getAllSorted();

    // const [userEntities, pageMetaDto] = await userEntitiesQuery.paginate(
    //   getUsersDto
    // );  

    return userEntitiesQuery
  }

  @Transactional()
  async updateUserPassword(id: string, user: UserDto, body: UpdatePasswordDto): Promise<void> {
    if (id !== user.id) {
      throw new ForbiddenException()
    }
    const userEntity = await this.getEntityByEmail(user.email);

    await this.validateUserPassword(userEntity, body.oldPassword);
    
    if (body.newPassword !== body.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (body.oldPassword === body.newPassword) {
      throw new BadRequestException('New password cannot be the same as old password')
    }

    // await this.addOrResetPassword(id, body.newPassword);
  }

  async validateUserPassword(userEntity: Candidate, password: string) {
    const isPasswordValid = await UtilsProvider.validateHash(
      password,
      // tmp solution
      "userEntity.password",
    );
    
    if (!isPasswordValid) {
      throw new UserUnauthenticatedException('password is an invalid');
    }

    return userEntity;
  } 

  async getCandidatesInterviews(candidateId: number) {
    await this.candidateRepository.findByUserId(candidateId);

    return this.meetingService.getInterviewsOfCandidate(candidateId);
  }

  @Transactional()
  async deleteUser(id: number): Promise<void> {
    await this.candidateRepository.findByUserId(id);
    await this.candidateRepository.delete(id);
  }

  async getCandidateWithLoginData(email: string) {
    const candidateEntity = await this.candidateRepository.getWithLoginData(email);

    return candidateEntity;
  }
}
