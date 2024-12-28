
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IdMatchEntity } from '../entities/IdMatch';

@CustomRepository(IdMatchEntity)
export class IdMatchRepository extends Repository<IdMatchEntity> {

  async findByCandidateId(candidateId: string): Promise<IdMatchEntity | null> {
    return this.createQueryBuilder('idmatch')
      .where('idmatch.candidateId = :candidateId', { candidateId })
      .getOne();
  }

  async getAllSorted(): Promise<IdMatchEntity[]> {
    return this.createQueryBuilder('idmatch')
      .orderBy('idmatch.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<IdMatchEntity> {
    const entity = await this.createQueryBuilder('idmatch')
      .where('idmatch.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${IdMatchEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
