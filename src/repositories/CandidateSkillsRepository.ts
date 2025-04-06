
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { CandidateSkills } from '../entities/CandidateSkills';

@CustomRepository(CandidateSkills)
export class CandidateSkillsRepository extends Repository<CandidateSkills> {

  async findByCandidateId(candidateId: string): Promise<CandidateSkills | null> {
    return this.createQueryBuilder('candidateskills')
      .where('candidateskills.candidateId = :candidateId', { candidateId })
      .getOne();
  }

  async findByCandidateIdAndSkill(candidateId: number, skillId: number) {
    return this.createQueryBuilder('candidateskills')
      .where('candidateskills.candidateId = :candidateId', { candidateId })
      .andWhere('candidateskills.skillId = :skillId', { skillId })
      .getOne();
  }

  async getAllSorted(): Promise<CandidateSkills[]> {
    return this.createQueryBuilder('candidateskills')
      .orderBy('candidateskills.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<CandidateSkills> {
    const entity = await this.createQueryBuilder('candidateskills')
      .where('candidateskills.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${CandidateSkills} not found with id: ${id}`);
    }

    return entity;
  }
}
