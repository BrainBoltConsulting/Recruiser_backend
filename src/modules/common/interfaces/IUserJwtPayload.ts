import { UsersEntity } from '../../../entities/Users';
import type { TokenTypeEnum } from '../../../constants/token-type.enum';
import type { UserDto } from '../modules/user/user.dto';

export interface IUserJwtPayload {
  id: string;
  user: UserDto | UsersEntity;
  type: TokenTypeEnum;
}
