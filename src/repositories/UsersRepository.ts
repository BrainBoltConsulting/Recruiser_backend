
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersEntity } from '../entities/Users';

@CustomRepository(UsersEntity)
export class UsersRepository extends Repository<UsersEntity> {

  async findByUserId(userId: string): Promise<UsersEntity | null> {
    return this.createQueryBuilder('users')
      .where('users.userId = :userId', { userId })
      .getOne();
  }

  async findByEmail(email: string): Promise<UsersEntity | null> {
    return this.createQueryBuilder('users')
      .where('users.email = :email', { email })
      .getOne();
  }

  async getAllSorted(): Promise<UsersEntity[]> {
    return this.createQueryBuilder('users')
      .getMany();
  }
}
