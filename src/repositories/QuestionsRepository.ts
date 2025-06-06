
import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { NotFoundException } from '@nestjs/common';
import { Questions } from '../entities/Questions';

@CustomRepository(Questions)
export class QuestionsRepository extends Repository<Questions> {

  async findByPrimarySkillId(primarySkillId: number, questionsTakeNumber: string): Promise<Questions[] | null> {
    return this.createQueryBuilder('questions')
      .where('questions.primarySkillId = :primarySkillId', { primarySkillId })
      .take(Number(questionsTakeNumber)) // tmp solution
      .getMany();
  }

  async getAllSorted(): Promise<Questions[]> {
    return this.createQueryBuilder('questions')
      .orderBy('questions.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Questions> {
    const entity = await this.createQueryBuilder('questions')
      .where('questions.questionId = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${Questions} not found with id: ${id}`);
    }

    return entity;
  }

  async findByIds(ids: string[]): Promise<Questions[]> {
    return this.createQueryBuilder('questions')
      .where("questions.questionId IN (:...ids)", { ids })
      .getMany();
  }

  async getQuestionsByDifficultyLevelAndBySkillsId(skillId: number, difficultyLevel: number, count: number) {
    if (count === 0) {
      return []; // because of typeorm issue
    }

    return this.createQueryBuilder("questions")
      .where("questions.difficulty_level = :level", { level: difficultyLevel })
      .andWhere("questions.primarySkillId = :skillId", { skillId })
      .orderBy("RANDOM()")
      .limit(count)
      .getMany();
  };
}
