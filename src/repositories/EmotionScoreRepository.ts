
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { EmotionScore } from '../entities/EmotionScore';

@CustomRepository(EmotionScore)
export class EmotionScoreRepository extends Repository<EmotionScore> {

  async getAllSorted(): Promise<EmotionScore[]> {
    return this.createQueryBuilder('emotionScore')
      .orderBy('evaluation.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<EmotionScore> {
    const entity = await this.createQueryBuilder('emotionScore')
      .where('emotionScore.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${EmotionScore} not found with id: ${id}`);
    }

    return entity;
  }
}
