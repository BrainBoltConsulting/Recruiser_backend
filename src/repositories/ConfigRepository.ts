
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Config } from '../entities/Config';

@CustomRepository(Config)
export class ConfigRepository extends Repository<Config> {

  async findByConfigName(configName: string): Promise<Config | null> {
    return this.createQueryBuilder('config')
      .where('config.configName = :configName', { configName })
      .getOne();
  }

  async getQuestionsbySkillSequence(skillSequenceNumber: number): Promise<Config | null> {
    return this.createQueryBuilder('config')
      .where('config.configName = :configName', { configName: `skill_sequence${skillSequenceNumber}` })
      .getOne();
  }

  async getAllSorted(): Promise<Config[]> {
    return this.createQueryBuilder('config')
      .orderBy('config.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Config> {
    const entity = await this.createQueryBuilder('config')
      .where('config.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Config} not found with id: ${id}`);
    }

    return entity;
  }
}
