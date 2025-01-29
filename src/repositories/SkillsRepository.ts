
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Skills } from '../entities/Skills';

@CustomRepository(Skills)
export class SkillsRepository extends Repository<Skills> {

  async findBySkillName(skillName: string): Promise<Skills | null> {
    return this.createQueryBuilder('skills')
      .where('skills.skillName = :skillName', { skillName })
      .getOne();
  }

  async getAllSorted(): Promise<Skills[]> {
    return this.createQueryBuilder('skills')
      .getMany();
  }

  async findById(id: number): Promise<Skills> {
    const entity = await this.createQueryBuilder('skills')
      .where('skills.skillId = :id', { id })
      .getOne();

    console.log(entity);  
    if (!entity) {
      throw new NotFoundException(`${Skills} not found with id: ${id}`);
    }

    return entity;
  }
}
