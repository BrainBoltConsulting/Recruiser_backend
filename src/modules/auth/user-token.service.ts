import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import type { TokenTypeEnum } from '../../constants/token-type.enum';
import type { UserTokenDto } from '../common/modules/auth/user-token.dto';
import { UpsertUserTokenDto } from './dtos/upsert-user-token.dto';
import { UserTokenNotFoundException } from './exceptions/user-token-not-found.exception';
import { UserTokenRepository } from './user-token.repository';

@Injectable()
export class UserTokenService {
  constructor(private readonly userTokenRepository: UserTokenRepository) {}

  @Transactional()
  async upsert(upsertUserTokenDto: UpsertUserTokenDto): Promise<UserTokenDto> {
    const entity =
      (await this.userTokenRepository.findByUserId(
        upsertUserTokenDto.userId,
      )) || this.userTokenRepository.create(upsertUserTokenDto);

    Object.assign(entity, upsertUserTokenDto);

    return (await this.userTokenRepository.save(entity)).toDto();
  }

  async getById(id: string): Promise<UserTokenDto> {
    const entity = await this.userTokenRepository.findByUserId(id);
    if (!entity) {
      throw new UserTokenNotFoundException();
    }

    return entity.toDto();
  }

  async getByUserIdAndType(userId: string, type: TokenTypeEnum) {
    try {
      const query = await this.userTokenRepository
      .createQueryBuilder('userToken')
      .where('userToken.user_id = :userId', { userId })
      .andWhere('userToken.type = :type', { type })
      .getOne();
      return query;
    } catch(error) {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    await this.userTokenRepository.delete(id);
  }
  
}
