
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Dishonest } from '../entities/Dishonest';

@CustomRepository(Dishonest)
export class DishonestRepository extends Repository<Dishonest> {

  async findByName(name: string): Promise<Dishonest | null> {
    return this.createQueryBuilder('dishonest')
      .where('dishonest.name = :name', { name })
      .getOne();
  }

  async getAllSorted(): Promise<Dishonest[]> {
    return this.createQueryBuilder('dishonest')
      .orderBy('dishonest.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Dishonest> {
    const entity = await this.createQueryBuilder('dishonest')
      .where('dishonest.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Dishonest} not found with id: ${id}`);
    }

    return entity;
  }

  async findByInterviewIdAndQuestionId(interviewId: number, questionId: string): Promise<Dishonest | null> {
    return this.createQueryBuilder('dishonest')
      .where('dishonest.interviewId = :interviewId', { interviewId})
      .andWhere('dishonest.questionId = :questionId', { questionId })
      .getOne()
  } 
}
