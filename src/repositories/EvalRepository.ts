
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EvalEntity } from '../entities/Eval';

@CustomRepository(EvalEntity)
export class EvalRepository extends Repository<EvalEntity> {

  async findByEvalId(evalId: string): Promise<EvalEntity | null> {
    return this.createQueryBuilder('eval')
      .where('eval.evalId = :evalId', { evalId })
      .getOne();
  }

  async getAllSorted(): Promise<EvalEntity[]> {
    return this.createQueryBuilder('eval')
      .orderBy('eval.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<EvalEntity> {
    const entity = await this.createQueryBuilder('eval')
      .where('eval.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${EvalEntity} not found with id: ${id}`);
    }

    return entity;
  }
}
