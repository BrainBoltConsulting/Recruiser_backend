import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CustomRepository } from '../db/typeorm-ex.decorator';
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

  async findByCUuid(cUuid: string): Promise<Candidate> {
    const entity = await this.createQueryBuilder('candidate')
      .where('candidate.cUuid = :cUuid', { cUuid })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`Candidate not found with c_uuid: ${cUuid}`);
    }

    return entity;
  }

  async getAllSorted(): Promise<Candidate[]> {
    return this.createQueryBuilder('candidate')
      .orderBy('candidate.createdAt', 'DESC')
      .getMany();
  }

  async getWithLoginData(email: string) {
    return this.createQueryBuilder('candidate')
      .where('candidate.email = :email', { email })
      .leftJoinAndSelect('candidate.login', 'login')
      .getOne();
  }

  async findManagerByCUuid(cUuid: string): Promise<Candidate | null> {
    return this.createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.jobShortlistedProfiles', 'shortlist')
      .leftJoinAndSelect('shortlist.manager', 'manager')
      .where('candidate.cUuid = :cUuid', { cUuid })
      .andWhere('shortlist.manager IS NOT NULL')
      .getOne();
  }
}
