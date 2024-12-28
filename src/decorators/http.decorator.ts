import type { PipeTransform, Type } from '@nestjs/common';
import {
  applyDecorators,
  Param,
  ParseUUIDPipe,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Role } from '../constants/role.enum';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthUserInterceptor } from '../interceptors/auth-user.interceptor';
import { AuthWithoutRequiredUserGuard } from '../guards/auth-without-required-user.guard';


export function Auth(roles: Role[], options = { setUserSession: false },) {
  return applyDecorators(
    SetMetadata('roles', roles),
    SetMetadata('userSession', options.setUserSession),
    UseGuards(AuthGuard, RolesGuard),
    UseInterceptors(AuthUserInterceptor),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

export function AuthWithoutRequiredUser() {
  return applyDecorators(
    UseGuards(AuthWithoutRequiredUserGuard),
    ApiBearerAuth()
  );
}

export function UUIDParam(
  property: string,
  ...pipes: Array<Type<PipeTransform> | PipeTransform>
): ParameterDecorator {
  return Param(property, new ParseUUIDPipe({ version: '4' }), ...pipes);
}