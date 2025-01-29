
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { CriteriaMaster } from '../entities/CriteriaMaster';

@CustomRepository(CriteriaMaster)
export class CriteriaMasterRepository extends Repository<CriteriaMaster> {

  async findByCriterionName(criterionName: string): Promise<CriteriaMaster | null> {
    return this.createQueryBuilder('criteriamaster')
      .where('criteriamaster.criterionName = :criterionName', { criterionName })
      .getOne();
  }

  async getAllSorted(): Promise<CriteriaMaster[]> {
    return this.createQueryBuilder('criteriamaster')
      .orderBy('criteriamaster.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<CriteriaMaster> {
    const entity = await this.createQueryBuilder('criteriamaster')
      .where('criteriamaster.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${CriteriaMaster} not found with id: ${id}`);
    }

    return entity;
  }
}
