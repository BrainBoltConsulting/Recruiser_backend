
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ResumeEntity } from '../entities/Resume';

@CustomRepository(ResumeEntity)
export class ResumeRepository extends Repository<ResumeEntity> {

  async findByCreatedOn(createdOn: string): Promise<ResumeEntity | null> {
    return this.createQueryBuilder('resume')
      .where('resume.createdOn = :createdOn', { createdOn })
      .getOne();
  }

  async getAllSorted(): Promise<ResumeEntity[]> {
    return this.createQueryBuilder('resume')
      .orderBy('resume.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ResumeEntity> {
    const entity = await this.createQueryBuilder('resume')
      .where('resume.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${ResumeEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
