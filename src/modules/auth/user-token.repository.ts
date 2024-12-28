import { Repository } from 'typeorm';

import { CustomRepository } from '../../db/typeorm-ex.decorator';
import { UserTokenEntity } from './user-token.entity';

@CustomRepository(UserTokenEntity)
export class UserTokenRepository extends Repository<UserTokenEntity> {
  async findByUserId(userId: string): Promise<UserTokenEntity | null> {
    return this.findOne({ where: { userId } });
  }
}
