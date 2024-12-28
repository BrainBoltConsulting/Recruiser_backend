import { UsersRepository } from './../../repositories/UsersRepository';
import { UserDto } from './../common/modules/user/user.dto';
import { MailService } from '../../shared/services/mail.service';
import { VerifyUserIdentityDto } from './dtoes/verify-user-identity.dto';
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { Role } from '../../constants/role.enum';
import { UtilsProvider } from '../../providers/utils.provider';
import { S3Service } from '../../shared/services/aws-s3.service';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
// import { UserRepository } from './repositories/user.repository';
import { UserTokenService } from '../auth/user-token.service';
import { TokenTypeEnum } from '../../constants/token-type.enum';
import { PageOptionsDto } from '../common/dtos/page-options.dto';
import { PageDto } from '../common/dtos/page.dto';
import { UrlService } from '../../shared/services/url.service';
import { UrlDto } from '../common/modules/shared/url.dto';
import { UpdateUserDto } from './dtoes/update-user.dto';
import { UserAlreadyExistsException } from './exceptions/user-already-exists.exception';
import { UpdatePasswordDto } from './dtoes/update-password.dto';
import { UserUnauthenticatedException } from '../auth/exceptions/user-unauthenticated.exception';
import { JwtStrategy } from '../auth/jwt.strategy';
import { GetUsersDto } from './dtoes/get-users.dto';
import { UsersEntity } from '../../entities/Users';

@Injectable()
export class UserService {
  constructor(
    public readonly userRepository: UsersRepository,
    public readonly s3Service: S3Service,
    public readonly mailService: MailService,
    private readonly jwtService: JwtStrategy,
    public readonly userTokenService: UserTokenService,
    public readonly urlService: UrlService,
  ) {}

  @Transactional()
  async create(data: Partial<UsersEntity>) {
    try {  
      let entityToSave: UsersEntity = this.userRepository.create(data);
      console.log(entityToSave)
      const entity = await this.userRepository.save(entityToSave);

      return entity;
    } catch (error) {
      console.log(error)
      throw new BadRequestException()
    }
  }
  async getEntityByEmail(email: string, withoutException?: boolean) {
    const entity = await this.userRepository.findByEmail(email);

    if (!entity && !withoutException) {
      throw new UserNotFoundException();
    }

    return entity;
  }

   async getEntityById(id: string) {
    const entity = await this.userRepository.findByUserId(id);
    
    return entity;
  }


  @Transactional()
  async sendInvitationViaEmail(email: string): Promise<void> {
    const userByEmail = await this.userRepository.findByEmail(email);

    if (!userByEmail) {
      throw new UserNotFoundException()
    }

    const token = this.jwtService.generateToken({
      payload: {
        id: userByEmail.userId,
        user: userByEmail,
        // user: userByEmail.toDto({isAccess: true}),
        type: TokenTypeEnum.SET_PASSWORD,
      },
    })

    await this.userTokenService.upsert({
      token,
      userId: userByEmail.userId,
      type: TokenTypeEnum.SET_PASSWORD
    })

    await this.mailService.send({
      to: userByEmail.email,
      subject: "You're Invited! Join Your Meeting on Canint",
      html: this.mailService.sendInvitationForAMeeting(userByEmail.name, userByEmail.techPrimary),
    });  }

  async getUserById(id: string) {
    const entity = await this.userRepository.findByUserId(id);
    
    //return entity.toDto();
    return entity;
  }
 
  @Transactional()
  async updateUser(id: string, user: UserDto, updateUserDto: UpdateUserDto) {

    if (Object.keys(updateUserDto).length) {
      await this.userRepository.update(id, {
        name: user.name
      });
    }

    return (await this.userRepository.findByUserId(id));

    // return (await this.userRepository.findById(id)).toDto({isAccess: true});
  }

  async getAllUsers(getUsersDto: GetUsersDto): Promise<UsersEntity[]> {
    let userEntitiesQuery = await this.userRepository.getAllSorted();
    console.log(userEntitiesQuery)
    // const [userEntities, pageMetaDto] = await userEntitiesQuery.paginate(
    //   getUsersDto
    // );  

    return userEntitiesQuery
  }

  @Transactional()
  async uploadUserFiles(id: string, user: UserDto,  files?: {formW9?: Express.Multer.File[], taxExemptionCertificate?: Express.Multer.File[], avatar?: Express.Multer.File[]}): Promise<UrlDto[]> {
    const userEntity = await this.userRepository.findByUserId(id);
    
    const fileEntities: Promise<UrlDto>[] = [];

    if (files?.avatar) {
      //fileEntities.push(this.urlService.upsertFile(id, files.avatar[0], UrlTypeEnum.FOR_USER_AVATAR, userEntity, TargetTypeEnum.USER))
    }

    return Promise.all(fileEntities);
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

  async validateUserPassword(userEntity: UsersEntity, password: string) {
    const isPasswordValid = await UtilsProvider.validateHash(
      password,
      userEntity.password,
    );
    
    if (!isPasswordValid) {
      throw new UserUnauthenticatedException('password is an invalid');
    }

    return userEntity;
  } 

  @Transactional()
  async deleteUser(id: string): Promise<void> {
    await this.userRepository.findByUserId(id);
    await this.userRepository.delete(id);
  }

}
