import { Injectable } from '@nestjs/common';
import { verify } from 'jsonwebtoken';

import { ApiConfigService } from '../../shared/services/api-config.service';

@Injectable()
export class JwtStrategy {
  constructor(private readonly configService: ApiConfigService) {}

  getPayload(token: string) {
    return verify(token, this.configService.jwtConfig.secret) as any;
  }
}
