
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Candidate } from '../entities/Candidate';

@CustomRepository(Candidate)
export class CandidateRepository extends Repository<Candidate> {

  async findByDomain(domain: string): Promise<Candidate | null> {
    return this.createQueryBuilder('candidate')
      .where('candidate.domain = :domain', { domain })
      .getOne();
  }

  async findByEmail(email: string): Promise<Candidate | null> {
    return this.createQueryBuilder('candidate')
      .where('candidate.email = :email', { email })
      .getOne();
  }

  async findByCandidateId(id: number): Promise<Candidate | null> {
    return this.createQueryBuilder('candidate')
      .where('candidate.candidateId = :id', { id })
      .getOne();
  }

  async getAllSorted(): Promise<Candidate[]> {
    return this.createQueryBuilder('candidate')
      .orderBy('candidate.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Candidate> {
    const entity = await this.createQueryBuilder('candidate')
      .where('candidate.candidateId = :id', { id })
      .getOne();

    return entity;
  }

  async getWithLoginData(email: string) {
    return this.createQueryBuilder('candidate')
      .where('candidate.email = :email', { email })
      .leftJoinAndSelect('candidate.login', 'login')
      .getOne();
  }
}
