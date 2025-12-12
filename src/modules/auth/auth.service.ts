import { LoginRepository } from './../../repositories/LoginRepository';
import { Candidate } from './../../entities/Candidate';
import { UserAlreadyExistsException } from '../candidate/exceptions/user-already-exists.exception';
import { Injectable} from '@nestjs/common';
import {Transactional} from 'typeorm-transactional';
import {TokenTypeEnum} from '../../constants/token-type.enum';
import {UtilsProvider} from '../../providers/utils.provider';
import {CandidateService} from '../candidate/candidate.service';
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
import { CognitoAuthService } from '../../shared/services/cognito-auth.service';
import { CognitoTokenResponseDto } from './dtos/cognito-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly loginRepository: LoginRepository,
    private readonly jwtService: JwtStrategy,
    private readonly configService: ApiConfigService,
    private readonly userTokenService: UserTokenService,
    private readonly mailService: MailService,
    private readonly cognitoAuthService: CognitoAuthService,
  ) {}

  @Transactional()
  async login(userObj: Candidate | LoginDto) {
    const userEntity =
      userObj instanceof Candidate
        ? userObj
        : await this.validateUser(userObj);

    // return this.jwtService.generateAccessPayload(userEntity.toDto({isAccess: true}));
    return this.jwtService.generateAccessPayload(userEntity);
  }

  async getMe(user: UserDto) {
    const userEntity = await this.candidateService.getEntityByEmail(user.email);
    return this.login(userEntity);
  }

  @Transactional()
  async refreshToken(refreshTokenDto: TokenDto) {
    try {
      const user = this.jwtService.getPayload(refreshTokenDto.token).user;
      const userEntity = await this.candidateService.getEntityByEmail(user.email);

      // return this.jwtService.generateAccessPayload(userEntity.toDto({isAccess: true}));
      return this.jwtService.generateAccessPayload(userEntity);
    } catch {
      throw new UserUnauthenticatedException();
    }
  }

  @Transactional()
  async registrationAndLogin(regDto: RegistrationDto, role: Role) {
    const userEntity = await this.candidateService.getEntityByEmail(regDto.email, true);

    if (userEntity) {
      throw new UserAlreadyExistsException()
    }

    const regUser = await this.candidateService.create({
      ...regDto,
      password: regDto.password,
    });
    const loginData = await this.login({ email: regUser.email, password: regUser.login.loginPassword });

    return loginData;
  }

  async validateUser(userLoginDto: LoginDto) {
    const candidateEntity = await this.candidateService.getCandidateWithLoginData(userLoginDto.email.toLowerCase());
    const isPasswordValid = await UtilsProvider.validateHash(
      userLoginDto.password,
      candidateEntity.login.loginPassword,
    );
    
    if (!isPasswordValid) {
      throw new UserUnauthenticatedException('password is an invalid');
    }

    return candidateEntity;
  }

  @Transactional()
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
      const userEntity = await this.candidateService.getEntityByEmail(forgotPasswordDto.email);
      const code = UtilsProvider.getRandomNum();
      
      await this.userTokenService.upsert({
        userId: userEntity.candidateId,
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
    const user = (await this.candidateService.getEntityByEmail(verifyCodeDto.userEmail));

    return this.verifyAccountOrResetPasswordActions(
      verifyCodeDto, 
      user, 
      verifyCodeDto.forVerifyAccount === true ? TokenTypeEnum.VERIFY_ACCOUNT : TokenTypeEnum.FORGOT_PASSWORD
    );
  }

  async verifyAccountOrResetPasswordActions(verifyCodeDto: VerifyCodeDto, user: Candidate, tokenType: TokenTypeEnum) {
    const targetToken: TokenTypeEnum = tokenType === TokenTypeEnum.VERIFY_ACCOUNT ? TokenTypeEnum.SET_PASSWORD : TokenTypeEnum.RESET_PASSWORD;
    const tokenEntity = await this.userTokenService.getByUserIdAndType(
      user.candidateId,
      tokenType,
    );

    if (tokenEntity?.token !== verifyCodeDto.code) {
      throw new InvalidCodeException();
    }

    const token = this.jwtService.generateToken({
      payload: {
        id: user.candidateId,
        user,
        type: targetToken,
      },
    });

    await this.userTokenService.delete(tokenEntity.userId);

    return this.userTokenService.upsert({
      userId: user.candidateId,
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

    await this.userTokenService.delete(userToken.id as number);
  }

  /**
   * Get Cognito tokens (ID token and Access token)
   * These tokens are used for authenticating with external APIs like the process API
   */
  async getCognitoTokens(): Promise<CognitoTokenResponseDto> {
    const idToken = await this.cognitoAuthService.getIdToken();
    const accessToken = await this.cognitoAuthService.getAccessToken();
    
    return {
      idToken,
      accessToken,
    };
  }
}
