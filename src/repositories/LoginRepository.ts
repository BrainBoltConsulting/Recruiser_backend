
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Login } from '../entities/Login';

@CustomRepository(Login)
export class LoginRepository extends Repository<Login> {

  async findByEmail(email: string): Promise<Login | null> {
    return this.createQueryBuilder('login')
      .where('login.email = :email', { email })
      .getOne();
  }

  async getAllSorted(): Promise<Login[]> {
    return this.createQueryBuilder('login')
      .orderBy('login.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Login> {
    const entity = await this.createQueryBuilder('login')
      .where('login.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Login} not found with id: ${id}`);
    }

    return entity;
  }
}
