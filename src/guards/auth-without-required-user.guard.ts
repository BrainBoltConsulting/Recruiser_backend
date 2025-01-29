import { CandidateRepository } from './../repositories/CandidateRepository';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UserUnauthenticatedException } from '../modules/auth/exceptions/user-unauthenticated.exception';
import {JwtStrategy} from "../modules/auth/jwt.strategy";

@Injectable()
export class AuthWithoutRequiredUserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtStrategy,
    private readonly candidateRepository: CandidateRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request?.headers?.authorization;
    if (!authHeader || !authHeader.includes('Bearer ')) {
      request.user = null;
      return true;
    }

    const token = (authHeader as string).slice(7);

    try {
      const user = this.jwtService.getPayload(token).user;
      const userEntity = await this.candidateRepository.findByEmail(user.email);

      if (!userEntity) {
        throw new UserUnauthenticatedException();
      }

      request.user = user;
    } catch {
      throw new UserUnauthenticatedException();
    }

    return true;
  }
}
