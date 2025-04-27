import { SkillsRepository } from './../../repositories/SkillsRepository';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { QuestionsRepository } from './../../repositories/QuestionsRepository';
import { PollyService } from './../../shared/services/aws-polly.service';
import { Injectable } from '@nestjs/common';
import { S3Service } from '../../shared/services/aws-s3.service';
import { GetQuestionsDto } from './dtos/get-questions.dto';
import { AnswersRepository } from '../../repositories/AnswersRepository';
import { Transactional } from 'typeorm-transactional';
import { SkillService } from '../skill/skill.service';
import { Questions } from '../../entities/Questions';

@Injectable()
export class QuestionService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly pollyService: PollyService,
    private readonly skillService: SkillService,
    private readonly questionsRepository: QuestionsRepository,
    private readonly answersRepository: AnswersRepository,
  ) {}

  async getAllQuestions(getQuestionsDto: GetQuestionsDto) {
    return (await this.questionsRepository.getAllSorted()).toDtos();
  }

  async getSingleQuestionsVoice(id: string) {
    const questionEntity = await this.questionsRepository.findById(id);
    
    return this.readQuestionByPolly(questionEntity.questionText);
  }

  @Transactional()
  async createNewQuestion(createQuestionDto: CreateQuestionDto) {
    const primarySkillEntity = await this.skillService.getSkillById(createQuestionDto.primarySkillId);

    const questionEntityToSave = this.questionsRepository.create({
      difficultyLevel: createQuestionDto.difficulty,
      questionLevel: createQuestionDto.level,
      timeToAnswer: createQuestionDto.timeToAnswer,
      primarySkillId: primarySkillEntity.skillId,
      questionText: createQuestionDto.question,
    });

    await this.answersRepository.save(this.answersRepository.create({
      answer: createQuestionDto.answer,
      question: questionEntityToSave,
      questionId: questionEntityToSave.questionId
    }));

    return this.questionsRepository.save(questionEntityToSave);
  }

  async deleteQuestionById(id: string): Promise<void> {
    await this.questionsRepository.delete(id);
  }

  async readQuestionByPolly(question: string) {
    return this.pollyService.generateSpeechStream(question);
  }

  async getQuestionsBySkill(skillId: number, questionsTakeNumber: string) {
    const questionEntities = await this.questionsRepository.findByPrimarySkillId(skillId, questionsTakeNumber);

    return questionEntities;
  }
  

  async getQuestionsByDifficultyLevelAndSkills(
    skills: { skillId: number, count: number }[],
    percentages: number[]
  ) {
    const allSelected: Questions[] = [];
  
    for (const { skillId, count } of skills) {
      const level1Count = Math.floor(count * (percentages[0] / 100));
      const level2Count = Math.floor(count * (percentages[1] / 100));
      const level3Count = count - level1Count - level2Count; 
  

      const questionsBySkillId = await Promise.all([
        this.questionsRepository.getQuestionsByDifficultyLevelAndBySkillsId(skillId, 1, level1Count),
        this.questionsRepository.getQuestionsByDifficultyLevelAndBySkillsId(skillId, 2, level2Count),
        this.questionsRepository.getQuestionsByDifficultyLevelAndBySkillsId(skillId, 3, level3Count)
      ])
  
      allSelected.push(...questionsBySkillId.flat());
    }
  
    const missingParentIds = allSelected
      .filter(question => question.questionLevel)
      .map(question => question.questionLevel.toString())
      .filter((id, i, arr) => !allSelected.find(question => question.questionId === id) && arr.indexOf(id) === i);
  
    const parentQuestions = missingParentIds.length
      ? await this.questionsRepository.findByIds(missingParentIds)
      : [];
  
    const allQuestionsWithParents = [...allSelected, ...parentQuestions];

    return allQuestionsWithParents;
  };

  sortQuestionsBySkillAndLevel(
    questions: Questions[],
    orderedSkillIds: number[]
  ): Questions[] {
    const questionMap = new Map<number, Questions>();
    const childMap = new Map<number, Questions[]>();
  
    questions.forEach((q) => {
      questionMap.set(Number(q.questionId), q);
      if (q.questionLevel) {
        if (!childMap.has(q.questionLevel)) {
          childMap.set(q.questionLevel, []);
        }
        childMap.get(q.questionLevel)!.push(q);
      }
    });
  
    const skillGroups = new Map<number, Questions[]>();
  
    questions.forEach((q) => {
      if (!skillGroups.has(q.primarySkillId)) {
        skillGroups.set(q.primarySkillId, []);
      }

      if (!q.questionLevel) {
        skillGroups.get(q.primarySkillId)!.push(q);
      }
    });
  
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
