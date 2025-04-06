import { Column, Entity, Unique } from 'typeorm';

import { TokenTypeEnum } from '../../constants/token-type.enum';
import { AbstractEntity } from '../common/entities/abstract.entity';
import { UserTokenDto } from '../common/modules/auth/user-token.dto';

@Entity('Users_Tokens')
@Unique(['userId', 'type'])
export class UserTokenEntity extends AbstractEntity<UserTokenDto> {
  @Column()
  userId: number;

  @Column()
  token: string;

  @Column({ type: 'enum', enum: TokenTypeEnum })
  type: TokenTypeEnum;

  dtoClass = UserTokenDto;
}
