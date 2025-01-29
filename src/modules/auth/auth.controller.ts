import {Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags} from '@nestjs/swagger';
import {Role} from '../../constants/role.enum';
import {AccessPayloadDto} from '../common/modules/auth/access-payload.dto';
import {AuthService} from './auth.service';
import {ForgotPasswordDto} from './dtos/forgot-password.dto';
import {LoginDto} from './dtos/login.dto';
import {RegistrationDto} from './dtos/registration.dto';
import {VerifyCodeDto} from './dtos/verify-code.dto';
import { MessageDto } from '../common/modules/shared/message.dto';
import { Auth, AuthWithoutRequiredUser } from '../../decorators/http.decorator';
import { AuthUser } from '../../decorators/auth.decorator';
import { UserDto } from '../common/modules/user/user.dto';

@Controller('/auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/me')
  // tmp solution
  @AuthWithoutRequiredUser()
  @HttpCode(HttpStatus.OK)
  async getMe(
    @AuthUser() user: UserDto
  ): Promise<AccessPayloadDto | MessageDto> {
    return this.authService.getMe(user);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AccessPayloadDto | MessageDto> {
    return this.authService.login(loginDto);
  }

  @Post('/registration')
  @HttpCode(HttpStatus.OK)
  async registration(
    @Body() regDto: RegistrationDto,
  ): Promise<AccessPayloadDto | MessageDto> {
    return (await this.authService.registrationAndLogin(regDto, Role.CANDIDATE)) as AccessPayloadDto;
  }

  // @Put('/refresh_token')
  // @HttpCode(HttpStatus.OK)
  // async refreshToken(
  //   @Body() refreshTokenDto: TokenDto,
  // ): Promise<AccessPayloadDto> {
  //   return this.authService.refreshToken(refreshTokenDto);
  // }

  // @Post('/forgot_password')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   description: 'Send Forgot Password Code To Email',
  // })
  // async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  //   return this.authService.forgotPassword(forgotPasswordDto);
  // }

  // @Post('/verify_code')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   description: 'Successfully reset password',
  // })
  // async verifyCode(@Body() verifyCode: VerifyCodeDto) {
  //   return this.authService.verifyCode(verifyCode);
  // }

  // @Post('/reset_password')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: AccessPayloadDto,
  //   description: 'Successfully reset or added password',
  // })
  // async resetPassword(
  //   @Body() resetPasswordDto: ResetPasswordDto,
  // ): Promise<AccessPayloadDto | MessageDto> {
  //   return this.authService.resetPassword(resetPasswordDto);
  // }

  // @Post('/set_password')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: AccessPayloadDto,
  //   description: 'Successfully added password',
  // })
  // async setPassword(
  //   @Body() setPasswordDto: SetPasswordDto,
  // ): Promise<any> {
  //   return this.authService.setPassword(setPasswordDto);
  // }
  
}
