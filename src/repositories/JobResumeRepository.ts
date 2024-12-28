
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { JobResumeEntity } from '../entities/JobResume';

@CustomRepository(JobResumeEntity)
export class JobResumeRepository extends Repository<JobResumeEntity> {

  async findByJobId(jobId: string): Promise<JobResumeEntity | null> {
    return this.createQueryBuilder('jobresume')
      .where('jobresume.jobId = :jobId', { jobId })
      .getOne();
  }

  async getAllSorted(): Promise<JobResumeEntity[]> {
    return this.createQueryBuilder('jobresume')
      .orderBy('jobresume.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<JobResumeEntity> {
    const entity = await this.createQueryBuilder('jobresume')
      .where('jobresume.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${JobResumeEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
