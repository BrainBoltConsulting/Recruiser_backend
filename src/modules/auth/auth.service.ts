import { Injectable } from '@nestjs/common';

import { CognitoAuthService } from '../../shared/services/cognito-auth.service';
import { CognitoTokenResponseDto } from './dtos/cognito-token.dto';

@Injectable()
export class AuthService {
  constructor(private readonly cognitoAuthService: CognitoAuthService) {}

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
