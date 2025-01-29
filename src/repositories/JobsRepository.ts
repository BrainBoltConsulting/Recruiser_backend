
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Jobs } from '../entities/Jobs';

@CustomRepository(Jobs)
export class JobsRepository extends Repository<Jobs> {

  async findByJobTitle(jobTitle: string): Promise<Jobs | null> {
    return this.createQueryBuilder('jobs')
      .where('jobs.jobTitle = :jobTitle', { jobTitle })
      .getOne();
  }

  async getAllSorted(): Promise<Jobs[]> {
    return this.createQueryBuilder('jobs')
      .orderBy('jobs.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Jobs> {
    const entity = await this.createQueryBuilder('jobs')
      .where('jobs.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Jobs} not found with id: ${id}`);
    }

    return entity;
  }
}
