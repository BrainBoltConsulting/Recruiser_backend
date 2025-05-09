
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

  async getQuestionsbySkillSequences(): Promise<Config[] | null> {
    return this.createQueryBuilder('config')
      .where("config.config_name LIKE :pattern", { pattern: 'skill_sequence%' })
      .getMany();      
  }

  async getQuestionsDifficultyLevelByPercentage(): Promise<Config[] | null> {
    return this.createQueryBuilder('config')
      .where("config.config_name LIKE :pattern", { pattern: 'difficulty_level%' })
      .getMany();      
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

  async getMeetingLinkExpiryValue(): Promise<Config> {
    return this.createQueryBuilder('config')
      .where('config.configName = :configName', { configName: "meeting_link_expiry" })
      .getOne();
  }
}
