import { Candidate } from './../../../../entities/Candidate';
import { ApiProperty } from '@nestjs/swagger';

import { UserDto } from '../user/user.dto';

export class AccessPayloadDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: Candidate;
}
