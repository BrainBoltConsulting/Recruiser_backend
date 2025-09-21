import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { CommunicationScores } from '../entities/CommunicationScores';

@CustomRepository(CommunicationScores)
export class CommunicationScoresRepository extends Repository<CommunicationScores> {

  async getAllSorted(): Promise<CommunicationScores[]> {
    return this.createQueryBuilder('communicationScores')
      .orderBy('communicationScores.createdOn', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<CommunicationScores> {
    const entity = await this.createQueryBuilder('communicationScores')
      .where('communicationScores.commScoreId = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${CommunicationScores} not found with id: ${id}`);
    }

    return entity;
  }

  async findByEvaluationId(evaluationId: string): Promise<CommunicationScores[]> {
    return this.createQueryBuilder('communicationScores')
      .where('communicationScores.evaluationId = :evaluationId', { evaluationId })
      .getMany();
  }
}
