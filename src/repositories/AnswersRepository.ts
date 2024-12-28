
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AnswersEntity } from '../entities/Answers';

@CustomRepository(AnswersEntity)
export class AnswersRepository extends Repository<AnswersEntity> {

  async findByAnswerId(answerId: string): Promise<AnswersEntity | null> {
    return this.createQueryBuilder('answers')
      .where('answers.answerId = :answerId', { answerId })
      .getOne();
  }

  async getAllSorted(): Promise<AnswersEntity[]> {
    return this.createQueryBuilder('answers')
      .orderBy('answers.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<AnswersEntity> {
    const entity = await this.createQueryBuilder('answers')
      .where('answers.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${AnswersEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
