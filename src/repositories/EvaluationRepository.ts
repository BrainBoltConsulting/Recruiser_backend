
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Evaluation } from '../entities/Evaluation';

@CustomRepository(Evaluation)
export class EvaluationRepository extends Repository<Evaluation> {

  async findByAsrfilename(asrfilename: string): Promise<Evaluation | null> {
    return this.createQueryBuilder('evaluation')
      .where('evaluation.asrfilename = :asrfilename', { asrfilename })
      .getOne();
  }

  async getAllSorted(): Promise<Evaluation[]> {
    return this.createQueryBuilder('evaluation')
      .orderBy('evaluation.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Evaluation> {
    const entity = await this.createQueryBuilder('evaluation')
      .where('evaluation.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Evaluation} not found with id: ${id}`);
    }

    return entity;
  }
}
