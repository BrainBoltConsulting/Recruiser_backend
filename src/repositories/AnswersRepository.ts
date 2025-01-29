
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Answers } from '../entities/Answers';

@CustomRepository(Answers)
export class AnswersRepository extends Repository<Answers> {

  async findByAnswer(answer: string): Promise<Answers | null> {
    return this.createQueryBuilder('answers')
      .where('answers.answer = :answer', { answer })
      .getOne();
  }

  async getAllSorted(): Promise<Answers[]> {
    return this.createQueryBuilder('answers')
      .orderBy('answers.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Answers> {
    const entity = await this.createQueryBuilder('answers')
      .where('answers.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Answers} not found with id: ${id}`);
    }

    return entity;
  }
}
