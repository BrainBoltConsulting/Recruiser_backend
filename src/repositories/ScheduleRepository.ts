
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ScheduleEntity } from '../entities/Schedule';

@CustomRepository(ScheduleEntity)
export class ScheduleRepository extends Repository<ScheduleEntity> {

  async findByCandidateId(candidateId: string): Promise<ScheduleEntity | null> {
    return this.createQueryBuilder('schedule')
      .where('schedule.candidateId = :candidateId', { candidateId })
      .getOne();
  }

  async getAllSorted(): Promise<ScheduleEntity[]> {
    return this.createQueryBuilder('schedule')
      .orderBy('schedule.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ScheduleEntity> {
    const entity = await this.createQueryBuilder('schedule')
      .where('schedule.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${ScheduleEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
