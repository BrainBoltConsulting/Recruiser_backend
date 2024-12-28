
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ManagerEntity } from '../entities/Manager';

@CustomRepository(ManagerEntity)
export class ManagerRepository extends Repository<ManagerEntity> {

  async findByCreatedOn(createdOn: string): Promise<ManagerEntity | null> {
    return this.createQueryBuilder('manager')
      .where('manager.createdOn = :createdOn', { createdOn })
      .getOne();
  }

  async getAllSorted(): Promise<ManagerEntity[]> {
    return this.createQueryBuilder('manager')
      .orderBy('manager.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ManagerEntity> {
    const entity = await this.createQueryBuilder('manager')
      .where('manager.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${ManagerEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
