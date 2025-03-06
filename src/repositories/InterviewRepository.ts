
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Interview } from '../entities/Interview';

@CustomRepository(Interview)
export class InterviewRepository extends Repository<Interview> {

  async findByName(name: string): Promise<Interview | null> {
    return this.createQueryBuilder('interview')
      .where('interview.name = :name', { name })
      .getOne();
  }

  async getAllSorted(): Promise<Interview[]> {
    return this.createQueryBuilder('interview')
      .orderBy('interview.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Interview> {
    const entity = await this.createQueryBuilder('interview')
      .where('interview.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Interview} not found with id: ${id}`);
    }

    return entity;
  }

  async findByCandidateId(candidateId: string): Promise<Interview | null> {
      return this.createQueryBuilder('interview')
        .where('interview.candidateId = :candidateId', { candidateId })
        .getOne();
  }
}
