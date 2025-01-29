
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { CandidateVerification } from '../entities/CandidateVerification';

@CustomRepository(CandidateVerification)
export class CandidateVerificationRepository extends Repository<CandidateVerification> {

  async findByName(name: string): Promise<CandidateVerification | null> {
    return this.createQueryBuilder('candidateverification')
      .where('candidateverification.name = :name', { name })
      .getOne();
  }

  async getAllSorted(): Promise<CandidateVerification[]> {
    return this.createQueryBuilder('candidateverification')
      .orderBy('candidateverification.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<CandidateVerification> {
    const entity = await this.createQueryBuilder('candidateverification')
      .where('candidateverification.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${CandidateVerification} not found with id: ${id}`);
    }

    return entity;
  }
}
