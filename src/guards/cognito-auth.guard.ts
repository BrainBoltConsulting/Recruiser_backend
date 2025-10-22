import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { CognitoJwtVerifier } from '../shared/services/cognito-jwt-verifier.service';

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private readonly logger = new Logger(CognitoAuthGuard.name);

  constructor(private readonly cognitoJwtVerifier: CognitoJwtVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request?.headers?.authorization;

    if (!authHeader || !authHeader.includes('Bearer ')) {
      this.logger.warn('No authorization header or Bearer token found');
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = (authHeader as string).slice(7);

    try {
      // Verify the Cognito JWT token
      const decodedToken = await this.cognitoJwtVerifier.verify(token);
      
      // Attach the decoded user information to the request
      request.user = {
        sub: decodedToken.sub,
        username: decodedToken['cognito:username'] || decodedToken.username,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        ...decodedToken,
      };

      this.logger.debug(`Cognito user authenticated: ${request.user.username}`);
      return true;
    } catch (error) {
      this.logger.error(`Cognito token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

