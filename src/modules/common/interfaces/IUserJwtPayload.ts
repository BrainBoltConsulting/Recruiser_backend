import { Candidate } from './../../../entities/Candidate';
import type { TokenTypeEnum } from '../../../constants/token-type.enum';
import type { UserDto } from '../modules/user/user.dto';

export interface IUserJwtPayload {
  id: number;
  user: UserDto | Candidate;
  type: TokenTypeEnum;
}
