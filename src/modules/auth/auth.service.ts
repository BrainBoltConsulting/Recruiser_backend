import { UsersEntity } from './../../entities/Users';
import { UserAlreadyExistsException } from '../user/exceptions/user-already-exists.exception';
import { Injectable} from '@nestjs/common';
import {Transactional} from 'typeorm-transactional';
import {TokenTypeEnum} from '../../constants/token-type.enum';
import {UtilsProvider} from '../../providers/utils.provider';
import {UserService} from '../user/user.service';
import {ForgotPasswordDto} from './dtos/forgot-password.dto';
import type {LoginDto} from './dtos/login.dto';
import {RegistrationDto} from './dtos/registration.dto';
import {ResetPasswordDto} from './dtos/reset-password.dto';
import {VerifyCodeDto} from './dtos/verify-code.dto';
import {InvalidCodeException} from './exceptions/invalid-code.exception';
import {InvalidResetPasswordTokenException} from './exceptions/invalid-reset-password-token.exception';
import {UserUnauthenticatedException} from './exceptions/user-unauthenticated.exception';
import { UserIsNotActiveException } from './exceptions/user-is-not-active.exception' 
import {JwtStrategy} from './jwt.strategy';
import {UserTokenService} from './user-token.service';
import {ApiConfigService} from "../../shared/services/api-config.service";
import { MailService } from "../../shared/services/mail.service";
import {MessageTypeEnum} from "../../constants/message.enum";
import {TokenDto} from "./dtos/token.dto";
import {Role} from "../../constants/role.enum";
import { UserDto } from '../common/modules/user/user.dto';
import { StatusEnum } from '../../constants/status.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly UserService: UserService,
    private readonly jwtService: JwtStrategy,
    private readonly configService: ApiConfigService,
    private readonly userTokenService: UserTokenService,
    private readonly mailService: MailService,
  ) {}

  @Transactional()
  async login(userObj: UsersEntity | LoginDto) {
    const userEntity: any =
      userObj instanceof UsersEntity
        ? userObj
        : await this.validateUser(userObj);
    console.log(userEntity)
    // return this.jwtService.generateAccessPayload(userEntity.toDto({isAccess: true}));
    return this.jwtService.generateAccessPayload(userEntity);
  }

  async getMe(user: UserDto) {
    const userEntity = await this.UserService.getEntityByEmail(user.email);
    return this.login(userEntity);
  }

  @Transactional()
  async refreshToken(refreshTokenDto: TokenDto) {
    try {
      const user = this.jwtService.getPayload(refreshTokenDto.token).user;
      const userEntity = await this.UserService.getEntityByEmail(user.email);

      // return this.jwtService.generateAccessPayload(userEntity.toDto({isAccess: true}));
      return this.jwtService.generateAccessPayload(userEntity);
    } catch {
      throw new UserUnauthenticatedException();
    }
  }

  @Transactional()
  async registrationAndLogin(regDto: RegistrationDto, role: Role) {
    const userEntity = await this.UserService.getEntityByEmail(regDto.email, true);

    if (userEntity) {
      throw new UserAlreadyExistsException()
    }

    const regUser = await this.UserService.create({
      ...regDto, 
      password: UtilsProvider.generateHash(regDto.password),
    });
    console.log(regUser)
    const loginData = await this.login(regUser);

    return loginData;
  }

  async validateUser(userLoginDto: LoginDto) {
    const userEntity = await this.UserService.getEntityByEmail(userLoginDto.email.toLowerCase());
    const isPasswordValid = await UtilsProvider.validateHash(
      userLoginDto.password,
      userEntity.password,
    );
    
    if (!isPasswordValid) {
      throw new UserUnauthenticatedException('password is an invalid');
    }

    return userEntity;
  }

  @Transactional()
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
      const userEntity = await this.UserService.getEntityByEmail(forgotPasswordDto.email);
      const code = UtilsProvider.getRandomNum();
      
      await this.userTokenService.upsert({
        userId: userEntity.userId,
        token: code,
        type: TokenTypeEnum.FORGOT_PASSWORD,
      });

      // await this.mailService.send({
      //   to: userEntity.email,
      //   subject: 'Password Reset Instructions',
      //   html: await this.mailService.forgotPasswordCodeMailHtml(userEntity.firstName, code, userEntity.email),
      // });
  }

  @Transactional()
  async verifyCode(verifyCodeDto: VerifyCodeDto) {
    const user = (await this.UserService.getEntityByEmail(verifyCodeDto.userEmail));

    return this.verifyAccountOrResetPasswordActions(
      verifyCodeDto, 
      user, 
      verifyCodeDto.forVerifyAccount === true ? TokenTypeEnum.VERIFY_ACCOUNT : TokenTypeEnum.FORGOT_PASSWORD
    );
  }

  async verifyAccountOrResetPasswordActions(verifyCodeDto: VerifyCodeDto, user: UsersEntity, tokenType: TokenTypeEnum) {
    const targetToken: TokenTypeEnum = tokenType === TokenTypeEnum.VERIFY_ACCOUNT ? TokenTypeEnum.SET_PASSWORD : TokenTypeEnum.RESET_PASSWORD;
    const tokenEntity = await this.userTokenService.getByUserIdAndType(
      user.userId,
      tokenType,
    );

    if (tokenEntity?.token !== verifyCodeDto.code) {
      throw new InvalidCodeException();
    }

    const token = this.jwtService.generateToken({
      payload: {
        id: user.userId,
        user,
        type: targetToken,
      },
    });

    await this.userTokenService.delete(tokenEntity.userId);

    return this.userTokenService.upsert({
      userId: user.userId,
      token,
      type: targetToken,
    });
  }

  @Transactional()
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const payload = this.jwtService.getPayload(resetPasswordDto.token);
    const userToken = await this.userTokenService.getById(
      payload?.id || payload?.user?.id,
    );

    if (
      !(
        payload.type === TokenTypeEnum.RESET_PASSWORD ||
        payload.type === TokenTypeEnum.SET_PASSWORD
      ) ||
      payload.type !== userToken.type
    ) {
      throw new InvalidResetPasswordTokenException();
    }

    await this.userTokenService.delete(userToken.id);
  }
}
