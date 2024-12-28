import type { TokenTypeEnum } from '../../../../constants/token-type.enum';
import type { UserTokenEntity } from '../../../auth/user-token.entity';
import { AbstractDto } from '../../dtos/abstract.dto';

export class UserTokenDto extends AbstractDto {
  userId: string;

  token: string;

  type: TokenTypeEnum;

  constructor(userTokenEntity: any) {
    super(userTokenEntity);

    this.userId = userTokenEntity.userId;
    this.token = userTokenEntity.token;
    this.type = userTokenEntity.type;
  }
}
