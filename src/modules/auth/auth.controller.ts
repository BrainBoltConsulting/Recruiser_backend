import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CognitoTokenResponseDto } from './dtos/cognito-token.dto';

@Controller('/auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/cognito-token')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: CognitoTokenResponseDto,
    description:
      'Returns Cognito ID token and Access token for API authentication',
  })
  async getCognitoToken(): Promise<CognitoTokenResponseDto> {
    return this.authService.getCognitoTokens();
  }
}
