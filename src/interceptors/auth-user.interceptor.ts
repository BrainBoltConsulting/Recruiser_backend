import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { StatusEnum } from '../constants/status.enum';
import type { Candidate } from '../entities/Candidate';
import { UserIsNotActiveException } from '../modules/auth/exceptions/user-is-not-active.exception';
import { ContextProvider } from '../providers/context.provider';

interface AuthUserInterceptorOptions {
  setUserSession?: boolean;
}

@Injectable()
export class AuthUserInterceptor implements NestInterceptor {
  constructor(
    private readonly dataSource: DataSource,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const request = context.switchToHttp().getRequest();

    if (request.user.status === StatusEnum.INACTIVE) {
      throw new UserIsNotActiveException();
    }

    ContextProvider.setAuthUser(<Candidate>request.user);

    const userSession = this.reflector.get<string[]>(
      'userSession',
      context.getHandler(),
    );

    if (userSession) {
      const userId = String(request.user.candidateId ?? request.user.id ?? '');
      await this.dataSource.query('SET app.current_user_id TO $1', [userId]);
    }

    return next.handle();
  }
}
