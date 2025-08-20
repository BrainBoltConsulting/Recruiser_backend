
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Manager } from '../entities/Manager';

@CustomRepository(Manager)
export class ManagerRepository extends Repository<Manager> {

  async findByName(name: string): Promise<Manager | null> {
    return this.createQueryBuilder('manager')
      .where('manager.name = :name', { name })
      .getOne();
  }

  async getAllSorted(): Promise<Manager[]> {
    return this.createQueryBuilder('manager')
      .orderBy('manager.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Manager> {
    const entity = await this.createQueryBuilder('manager')
      .where('manager.managerId = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Manager} not found with id: ${id}`);
    }

    return entity;
  }
}
