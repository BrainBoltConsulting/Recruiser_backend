import { Injectable } from '@nestjs/common';

import type { Questions } from '../../entities/Questions';
import { QuestionsRepository } from '../../repositories/QuestionsRepository';

@Injectable()
export class QuestionService {
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async getQuestionsByDifficultyLevelAndSkills(
    skills: Array<{ skillId: number; count: number }>,
    percentages: number[],
  ) {
    const allSelected: Questions[] = [];

    for (const { skillId, count } of skills) {
      const level1Count = Math.floor(count * (percentages[0] / 100));
      const level2Count = Math.floor(count * (percentages[1] / 100));
      const level3Count = count - level1Count - level2Count;

      // eslint-disable-next-line no-await-in-loop
      const questionsBySkillId = await Promise.all([
        this.questionsRepository.getQuestionsByDifficultyLevelAndBySkillsId(
          skillId,
          1,
          level1Count,
        ),
        this.questionsRepository.getQuestionsByDifficultyLevelAndBySkillsId(
          skillId,
          2,
          level2Count,
        ),
        this.questionsRepository.getQuestionsByDifficultyLevelAndBySkillsId(
          skillId,
          3,
          level3Count,
        ),
      ]);

      allSelected.push(...questionsBySkillId.flat());
    }

    const missingParentIds = allSelected
      .filter((question) => question.questionLevel)
      .map((question) => question.questionLevel.toString())
      .filter(
        (id, i, arr) =>
          !allSelected.some((question) => question.questionId === id) &&
          arr.indexOf(id) === i,
      );

    const parentQuestions =
      missingParentIds.length > 0
        ? await this.questionsRepository.findByIds(missingParentIds)
        : [];

    const allQuestionsWithParents = [...allSelected, ...parentQuestions];

    return allQuestionsWithParents;
  }

  sortQuestionsBySkillAndLevel(
    questions: Questions[],
    orderedSkillIds: number[],
  ): Questions[] {
    const { childMap, skillGroups } = this.buildQuestionMaps(questions);

    return this.buildSortedResult(orderedSkillIds, skillGroups, childMap);
  }

  private buildQuestionMaps(questions: Questions[]) {
    const childMap = new Map<number, Questions[]>();
    const skillGroups = new Map<number, Questions[]>();

    for (const q of questions) {
      if (q.questionLevel) {
        if (!childMap.has(q.questionLevel)) {
          childMap.set(q.questionLevel, []);
        }

        childMap.get(q.questionLevel)!.push(q);
      } else {
        if (!skillGroups.has(q.primarySkillId)) {
          skillGroups.set(q.primarySkillId, []);
        }

        skillGroups.get(q.primarySkillId)!.push(q);
      }
    }

    return { childMap, skillGroups };
  }

  private buildSortedResult(
    orderedSkillIds: number[],
    skillGroups: Map<number, Questions[]>,
    childMap: Map<number, Questions[]>,
  ): Questions[] {
    const sortedResult: Questions[] = [];

    for (const skillId of orderedSkillIds) {
      const skillQuestions = skillGroups.get(skillId) || [];

      for (const parent of skillQuestions) {
        sortedResult.push(parent);

        const children = childMap.get(Number(parent.questionId)) || [];
        children.sort((a, b) => Number(a.questionId) - Number(b.questionId));
        sortedResult.push(...children);
      }
    }

    return sortedResult;
  }
}
