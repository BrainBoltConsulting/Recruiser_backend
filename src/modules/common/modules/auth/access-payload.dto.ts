import { UsersEntity } from './../../../../entities/Users';
import { ApiProperty } from '@nestjs/swagger';

import { UserDto } from '../user/user.dto';

export class AccessPayloadDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: UsersEntity;
}
