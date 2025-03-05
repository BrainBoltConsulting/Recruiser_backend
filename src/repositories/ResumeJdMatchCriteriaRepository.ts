
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { ResumeJdMatchCriteria } from '../entities/ResumeJdMatchCriteria';

@CustomRepository(ResumeJdMatchCriteria)
export class ResumeJdMatchCriteriaRepository extends Repository<ResumeJdMatchCriteria> {

  async findByRjdMatchName(rjdMatchName: string): Promise<ResumeJdMatchCriteria | null> {
    return this.createQueryBuilder('resumejdmatchcriteria')
      .where('resumejdmatchcriteria.rjdMatchName = :rjdMatchName', { rjdMatchName })
      .getOne();
  }

  async getAllSorted(): Promise<ResumeJdMatchCriteria[]> {
    return this.createQueryBuilder('resumejdmatchcriteria')
      .orderBy('resumejdmatchcriteria.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ResumeJdMatchCriteria> {
    const entity = await this.createQueryBuilder('resumejdmatchcriteria')
      .where('resumejdmatchcriteria.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${ResumeJdMatchCriteria} not found with id: ${id}`);
    }

    return entity;
  }
}
