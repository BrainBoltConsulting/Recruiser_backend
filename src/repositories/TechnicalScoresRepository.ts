import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { TechnicalScores } from '../entities/TechnicalScores';

@CustomRepository(TechnicalScores)
export class TechnicalScoresRepository extends Repository<TechnicalScores> {

  async getAllSorted(): Promise<TechnicalScores[]> {
    return this.createQueryBuilder('technicalScores')
      .orderBy('technicalScores.createdOn', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<TechnicalScores> {
    const entity = await this.createQueryBuilder('technicalScores')
      .where('technicalScores.techScoreId = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${TechnicalScores} not found with id: ${id}`);
    }

    return entity;
  }

  async findByEvaluationId(evaluationId: string): Promise<TechnicalScores[]> {
    return this.createQueryBuilder('technicalScores')
      .where('technicalScores.evaluationId = :evaluationId', { evaluationId })
      .getMany();
  }
}
