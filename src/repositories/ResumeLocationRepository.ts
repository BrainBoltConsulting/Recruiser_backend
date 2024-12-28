
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ResumeLocationEntity } from '../entities/ResumeLocation';

@CustomRepository(ResumeLocationEntity)
export class ResumeLocationRepository extends Repository<ResumeLocationEntity> {

  async findByCreatedOn(createdOn: string): Promise<ResumeLocationEntity | null> {
    return this.createQueryBuilder('resumelocation')
      .where('resumelocation.createdOn = :createdOn', { createdOn })
      .getOne();
  }

  async getAllSorted(): Promise<ResumeLocationEntity[]> {
    return this.createQueryBuilder('resumelocation')
      .orderBy('resumelocation.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ResumeLocationEntity> {
    const entity = await this.createQueryBuilder('resumelocation')
      .where('resumelocation.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${ResumeLocationEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
