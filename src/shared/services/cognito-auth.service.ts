import { Injectable, Logger } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  AuthFlowType,
  AuthenticationResultType,
  RespondToAuthChallengeCommand,
  RespondToAuthChallengeCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class CognitoAuthService {
  private readonly logger = new Logger(CognitoAuthService.name);
  private cognitoClient: CognitoIdentityProviderClient;
  private tokenCache: Map<string, { accessToken: string; idToken: string; expiresAt: number }> = new Map();

  constructor(private readonly apiConfigService: ApiConfigService) {
    const cognitoConfig = this.apiConfigService.cognitoConfig;
    
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.apiConfigService.awsConfig.region,
      credentials: this.apiConfigService.awsConfig.credentials,
    });
  }

  /**
   * Calculate SECRET_HASH for Cognito authentication
   * SECRET_HASH = HMAC-SHA256(ClientSecret, Username + ClientId)
   */
  private calculateSecretHash(username: string, clientId: string, clientSecret: string): string {
    const message = username + clientId;
    return createHmac('sha256', clientSecret).update(message).digest('base64');
  }

  /**
   * Handle NEW_PASSWORD_REQUIRED challenge
   */
  private async handleNewPasswordChallenge(
    challengeResponse: any,
    cognitoConfig: any,
    authParameters: Record<string, string>
  ): Promise<any> {
    this.logger.debug('Handling NEW_PASSWORD_REQUIRED challenge');
    
    const challengeParams: RespondToAuthChallengeCommandInput = {
      ClientId: cognitoConfig.clientId,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: challengeResponse.Session,
      ChallengeResponses: {
        USERNAME: cognitoConfig.systemUsername,
        NEW_PASSWORD: cognitoConfig.systemPassword,
      },
    };

    // Note: Not including email in challenge response since the user already has an email set
    // and Cognito doesn't allow modifying an already provided email
    this.logger.debug('Skipping email attribute - user already has email set');

    // Add SECRET_HASH if client secret is provided
    if (cognitoConfig.clientSecret) {
      challengeParams.ChallengeResponses.SECRET_HASH = this.calculateSecretHash(
        cognitoConfig.systemUsername,
        cognitoConfig.clientId,
        cognitoConfig.clientSecret
      );
    }

    this.logger.debug('Challenge response parameters:', JSON.stringify(challengeParams, null, 2));
    
    const command = new RespondToAuthChallengeCommand(challengeParams);
    const response = await this.cognitoClient.send(command);
    
    this.logger.debug('Challenge response:', JSON.stringify(response, null, 2));
    return response;
  }

  /**
   * Authenticate with Cognito and get tokens
   * Uses cached tokens if still valid
   */
  private async getTokens(): Promise<{ accessToken: string; idToken: string }> {
    const cacheKey = 'system_user_token';
    const cached = this.tokenCache.get(cacheKey);
    
    // Check if cached tokens are still valid (with 5 minute buffer)
    if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
      this.logger.debug('Using cached Cognito tokens');
      return { accessToken: cached.accessToken, idToken: cached.idToken };
    }

    try {
      const cognitoConfig = this.apiConfigService.cognitoConfig;
      
      // Calculate SECRET_HASH if client secret is provided
      const authParameters: Record<string, string> = {
        USERNAME: cognitoConfig.systemUsername,
        PASSWORD: cognitoConfig.systemPassword,
      };

      if (cognitoConfig.clientSecret) {
        authParameters.SECRET_HASH = this.calculateSecretHash(
          cognitoConfig.systemUsername,
          cognitoConfig.clientId,
          cognitoConfig.clientSecret
        );
      }
      
      // Try USER_PASSWORD_AUTH first, fallback to ADMIN_NO_SRP_AUTH
      let response;
      
      try {
        this.logger.debug('Trying USER_PASSWORD_AUTH flow');
        const params: InitiateAuthCommandInput = {
          AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
          ClientId: cognitoConfig.clientId,
          AuthParameters: authParameters,
        };
        
        this.logger.debug('Auth parameters:', JSON.stringify(authParameters, null, 2));
        const command = new InitiateAuthCommand(params);
        response = await this.cognitoClient.send(command);
        this.logger.debug('USER_PASSWORD_AUTH flow successful');
      } catch (error) {
        if (error.message?.includes('USER_PASSWORD_AUTH flow not enabled')) {
          this.logger.warn('USER_PASSWORD_AUTH not available, trying ADMIN_NO_SRP_AUTH');
          
          const params: InitiateAuthCommandInput = {
            AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
            ClientId: cognitoConfig.clientId,
            AuthParameters: authParameters,
          };
          
          this.logger.debug('Auth parameters for ADMIN_NO_SRP_AUTH:', JSON.stringify(authParameters, null, 2));
          const command = new InitiateAuthCommand(params);
          response = await this.cognitoClient.send(command);
          this.logger.debug('ADMIN_NO_SRP_AUTH flow successful');
        } else {
          throw error;
        }
      }

      // Log the full response for debugging
      this.logger.debug('Cognito response:', JSON.stringify(response, null, 2));

      // Handle NEW_PASSWORD_REQUIRED challenge
      if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        this.logger.debug('NEW_PASSWORD_REQUIRED challenge received, handling...');
        response = await this.handleNewPasswordChallenge(response, cognitoConfig, authParameters);
      }

      if (!response.AuthenticationResult?.AccessToken) {
        this.logger.error('No access token in Cognito response:', {
          hasAuthenticationResult: !!response.AuthenticationResult,
          authenticationResult: response.AuthenticationResult,
          challengeName: response.ChallengeName,
          session: response.Session,
        });
        throw new Error('No access token received from Cognito');
      }

      if (!response.AuthenticationResult?.IdToken) {
        this.logger.error('No ID token in Cognito response:', {
          hasAuthenticationResult: !!response.AuthenticationResult,
          authenticationResult: response.AuthenticationResult,
          challengeName: response.ChallengeName,
          session: response.Session,
        });
        throw new Error('No ID token received from Cognito');
      }

      const accessToken = response.AuthenticationResult.AccessToken;
      const idToken = response.AuthenticationResult.IdToken;
      const expiresIn = response.AuthenticationResult.ExpiresIn || 3600; // Default to 1 hour
      const expiresAt = Date.now() + (expiresIn * 1000);

      // Cache both tokens
      this.tokenCache.set(cacheKey, {
        accessToken,
        idToken,
        expiresAt,
      });

      this.logger.debug('Successfully authenticated with Cognito');
      return { accessToken, idToken };
    } catch (error) {
      this.logger.error('Failed to authenticate with Cognito', error);
      throw new Error(`Cognito authentication failed: ${error.message}`);
    }
  }

  /**
   * Get access token
   * Uses cached token if still valid
   */
  async getAccessToken(): Promise<string> {
    const tokens = await this.getTokens();
    return tokens.accessToken;
  }

  /**
   * Get ID token
   * Uses cached token if still valid
   */
  async getIdToken(): Promise<string> {
    const tokens = await this.getTokens();
    return tokens.idToken;
  }

  /**
   * Clear cached tokens (useful for testing or when credentials change)
   */
  clearTokenCache(): void {
    this.tokenCache.clear();
    this.logger.debug('Cognito token cache cleared');
  }
}
