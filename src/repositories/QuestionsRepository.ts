import { QuestionsEntity } from './../entities/Questions';
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';

@CustomRepository(QuestionsEntity)
export class QuestionsRepository extends Repository<QuestionsEntity> {

  async findByQuestionId(questionId: string): Promise<QuestionsEntity | null> {
    return this.createQueryBuilder('questions')
      .where('questions.questionId = :questionId', { questionId })
      .getOne();
  }

  async getAllSorted(): Promise<QuestionsEntity[]> {
    return this.createQueryBuilder('questions')
      // .orderBy('questions.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<QuestionsEntity> {
    const entity = await this.createQueryBuilder('questions')
      .where('questions.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${QuestionsEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
