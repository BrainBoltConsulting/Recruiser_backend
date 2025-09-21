import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { VocabScore } from '../entities/VocabScore';

@CustomRepository(VocabScore)
export class VocabScoreRepository extends Repository<VocabScore> {

  async getAllSorted(): Promise<VocabScore[]> {
    return this.createQueryBuilder('vocabScore')
      .orderBy('vocabScore.createdOn', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<VocabScore> {
    const entity = await this.createQueryBuilder('vocabScore')
      .where('vocabScore.vocabScoreId = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${VocabScore} not found with id: ${id}`);
    }

    return entity;
  }

  async findByInterviewId(interviewId: string): Promise<VocabScore[]> {
    return this.createQueryBuilder('vocabScore')
      .where('vocabScore.interviewId = :interviewId', { interviewId })
      .getMany();
  }
}
