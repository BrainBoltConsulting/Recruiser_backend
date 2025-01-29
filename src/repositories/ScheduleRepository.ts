
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Schedule } from '../entities/Schedule';

@CustomRepository(Schedule)
export class ScheduleRepository extends Repository<Schedule> {

  async findByName(name: string): Promise<Schedule | null> {
    return this.createQueryBuilder('schedule')
      .where('schedule.name = :name', { name })
      .getOne();
  }

  async getAllSorted(): Promise<Schedule[]> {
    return this.createQueryBuilder('schedule')
      .orderBy('schedule.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Schedule> {
    const entity = await this.createQueryBuilder('schedule')
      .where('schedule.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Schedule} not found with id: ${id}`);
    }

    return entity;
  }
}
