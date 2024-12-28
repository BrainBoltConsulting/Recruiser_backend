
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DishonestEntity } from '../entities/Dishonest';

@CustomRepository(DishonestEntity)
export class DishonestRepository extends Repository<DishonestEntity> {

  async findByCandidateId(candidateId: string): Promise<DishonestEntity | null> {
    return this.createQueryBuilder('dishonest')
      .where('dishonest.candidateId = :candidateId', { candidateId })
      .getOne();
  }

  async getAllSorted(): Promise<DishonestEntity[]> {
    return this.createQueryBuilder('dishonest')
      .orderBy('dishonest.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<DishonestEntity> {
    const entity = await this.createQueryBuilder('dishonest')
      .where('dishonest.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${DishonestEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
