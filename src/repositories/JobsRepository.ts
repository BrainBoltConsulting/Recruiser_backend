
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { JobsEntity } from '../entities/Jobs';

@CustomRepository(JobsEntity)
export class JobsRepository extends Repository<JobsEntity> {

  async findByCreatedOn(createdOn: string): Promise<JobsEntity | null> {
    return this.createQueryBuilder('jobs')
      .where('jobs.createdOn = :createdOn', { createdOn })
      .getOne();
  }

  async getAllSorted(): Promise<JobsEntity[]> {
    return this.createQueryBuilder('jobs')
      .orderBy('jobs.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<JobsEntity> {
    const entity = await this.createQueryBuilder('jobs')
      .where('jobs.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${JobsEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
