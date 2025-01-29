
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { JobShortlistedProfiles } from '../entities/JobShortlistedProfiles';

@CustomRepository(JobShortlistedProfiles)
export class JobShortlistedProfilesRepository extends Repository<JobShortlistedProfiles> {

  async findByName(name: string): Promise<JobShortlistedProfiles | null> {
    return this.createQueryBuilder('jobshortlistedprofiles')
      .where('jobshortlistedprofiles.name = :name', { name })
      .getOne();
  }

  async getAllSorted(): Promise<JobShortlistedProfiles[]> {
    return this.createQueryBuilder('jobshortlistedprofiles')
      .orderBy('jobshortlistedprofiles.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<JobShortlistedProfiles> {
    const entity = await this.createQueryBuilder('jobshortlistedprofiles')
      .where('jobshortlistedprofiles.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${JobShortlistedProfiles} not found with id: ${id}`);
    }

    return entity;
  }
}
