
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { ResumeCriteriaMaster } from '../entities/ResumeCriteriaMaster';

@CustomRepository(ResumeCriteriaMaster)
export class ResumeCriteriaMasterRepository extends Repository<ResumeCriteriaMaster> {

  async findByCriterionName(criterionName: string): Promise<ResumeCriteriaMaster | null> {
    return this.createQueryBuilder('resumecriteriamaster')
      .where('resumecriteriamaster.criterionName = :criterionName', { criterionName })
      .getOne();
  }

  async getAllSorted(): Promise<ResumeCriteriaMaster[]> {
    return this.createQueryBuilder('resumecriteriamaster')
      .orderBy('resumecriteriamaster.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ResumeCriteriaMaster> {
    const entity = await this.createQueryBuilder('resumecriteriamaster')
      .where('resumecriteriamaster.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${ResumeCriteriaMaster} not found with id: ${id}`);
    }

    return entity;
  }
}
