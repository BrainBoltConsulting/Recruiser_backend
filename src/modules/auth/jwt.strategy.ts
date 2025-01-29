import { Candidate } from './../../entities/Candidate';
import { Injectable } from '@nestjs/common';
import {sign, verify} from 'jsonwebtoken';

import { TokenTypeEnum } from '../../constants/token-type.enum';
import type { IGenerateJWTOptions } from '../common/interfaces/IGenerateJWTOptions';
import type { AccessPayloadDto } from '../common/modules/auth/access-payload.dto';
import { UserDto } from '../common/modules/user/user.dto';
import {ApiConfigService} from "../../shared/services/api-config.service";

@Injectable()
export class JwtStrategy {
  constructor(
    private readonly configService: ApiConfigService,
  ) {}

  generateToken(options: IGenerateJWTOptions) {
    return options.expiresIn
      ? sign(options.payload, this.configService.jwtConfig.secret, {
          expiresIn: options.expiresIn,
        })
      : sign(options.payload, this.configService.jwtConfig.secret);
  }

  async generateAccessPayload(user: Candidate): Promise<AccessPayloadDto> {
    const accessToken = this.generateToken({
      payload: { id: user.candidateId, user, type: TokenTypeEnum.AUTH },
      expiresIn: this.configService.jwtConfig.accessTokenExpiry,
    });
    const refreshToken = this.generateToken({
      payload: { id: user.candidateId, user, type: TokenTypeEnum.REFRESH },
      expiresIn: this.configService.jwtConfig.refreshTokenExpiry,
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  getPayload(token: string) {
    return verify(
        token,
        this.configService.jwtConfig.secret,
    ) as any
  }
}
