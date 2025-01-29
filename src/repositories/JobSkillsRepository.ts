
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { JobSkills } from '../entities/JobSkills';

@CustomRepository(JobSkills)
export class JobSkillsRepository extends Repository<JobSkills> {

  async findByIsMandatory(isMandatory: string): Promise<JobSkills | null> {
    return this.createQueryBuilder('jobskills')
      .where('jobskills.isMandatory = :isMandatory', { isMandatory })
      .getOne();
  }

  async getAllSorted(): Promise<JobSkills[]> {
    return this.createQueryBuilder('jobskills')
      .orderBy('jobskills.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<JobSkills> {
    const entity = await this.createQueryBuilder('jobskills')
      .where('jobskills.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${JobSkills} not found with id: ${id}`);
    }

    return entity;
  }
}
