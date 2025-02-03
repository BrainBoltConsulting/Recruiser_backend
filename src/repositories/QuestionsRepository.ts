
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Questions } from '../entities/Questions';

@CustomRepository(Questions)
export class QuestionsRepository extends Repository<Questions> {

  async findByPrimarySkillId(primarySkillId: string): Promise<Questions | null> {
    return this.createQueryBuilder('questions')
      .where('questions.primarySkillId = :primarySkillId', { primarySkillId })
      .getOne();
  }

  async getAllSorted(): Promise<Questions[]> {
    return this.createQueryBuilder('questions')
      .orderBy('questions.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Questions> {
    const entity = await this.createQueryBuilder('questions')
      .where('questions.questionId = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Questions} not found with id: ${id}`);
    }

    return entity;
  }
}
