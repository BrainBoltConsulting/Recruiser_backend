
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { ResumeScores } from '../entities/ResumeScores';

@CustomRepository(ResumeScores)
export class ResumeScoresRepository extends Repository<ResumeScores> {

  async findByManagerId(managerId: string): Promise<ResumeScores | null> {
    return this.createQueryBuilder('resumescores')
      .where('resumescores.managerId = :managerId', { managerId })
      .getOne();
  }

  async getAllSorted(): Promise<ResumeScores[]> {
    return this.createQueryBuilder('resumescores')
      .orderBy('resumescores.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ResumeScores> {
    const entity = await this.createQueryBuilder('resumescores')
      .where('resumescores.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${ResumeScores} not found with id: ${id}`);
    }

    return entity;
  }
}
