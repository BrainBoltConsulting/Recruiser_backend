import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import type { Questions } from '../../entities/Questions';
import { UtilsProvider } from '../../providers/utils.provider';
import { AnswersRepository } from '../../repositories/AnswersRepository';
import { QuestionsRepository } from '../../repositories/QuestionsRepository';
import { PollyService } from '../../shared/services/aws-polly.service';
import { S3Service } from '../../shared/services/aws-s3.service';
import { SkillService } from '../skill/skill.service';
import { CreateQuestionDto } from './dtos/create-question.dto';
import type { GetQuestionsDto } from './dtos/get-questions.dto';

@Injectable()
export class QuestionService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly pollyService: PollyService,
    private readonly skillService: SkillService,
    private readonly questionsRepository: QuestionsRepository,
    private readonly answersRepository: AnswersRepository,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAllQuestions(getQuestionsDto: GetQuestionsDto) {
    return (await this.questionsRepository.getAllSorted()).toDtos();
  }

  async getSingleQuestionsVoice(id: string) {
    const questionEntity = await this.questionsRepository.findById(id);

    return this.readQuestionByPolly(questionEntity.questionText);
  }

  @Transactional()
  async createNewQuestion(
    createQuestionDto: CreateQuestionDto,
    files: { videoFile?: Express.Multer.File[] } = {},
  ): Promise<Questions> {
    const primarySkillEntity = await this.skillService.getSkillById(
      createQuestionDto.primarySkillId,
    );

    const questionEntityToSave = await this.questionsRepository.save(
      this.questionsRepository.create({
        difficultyLevel: createQuestionDto.difficulty,
        questionLevel: null, // temporary solution  TODO: add level
        timeToAnswer: createQuestionDto.timeToAnswer,
        primarySkillId: primarySkillEntity.skillId,
        questionText: createQuestionDto.question,
        subTech: 'Core',
      }),
    );

    if (files.videoFile && files.videoFile.length > 0) {
      const videoFile = files.videoFile[0];
      const responseFromS3 = await this.s3Service.uploadFile(
        videoFile,
        'VideoAvatarQuestions',
        questionEntityToSave.questionId +
          videoFile.mimetype.replace('video/', '.'),
      );

      questionEntityToSave.questionVideoS3Link =
        UtilsProvider.createS3UriFromS3BucketAndKey(
          responseFromS3.Bucket,
          responseFromS3.Key,
        );
    }

    await this.answersRepository.save(
      this.answersRepository.create({
        answer: createQuestionDto.answer,
        question: questionEntityToSave,
        questionId: questionEntityToSave.questionId,
      }),
    );

    return this.questionsRepository.save(questionEntityToSave);
  }

  async deleteQuestionById(id: string): Promise<void> {
    await this.answersRepository.deleteByQuestionId(id);

    await this.questionsRepository.delete(id);
  }

  async readQuestionByPolly(question: string) {
    return this.pollyService.generateSpeechStream(question);
  }

  async getQuestionsBySkill(skillId: number, questionsTakeNumber: string) {
    const questionEntities =
      await this.questionsRepository.findByPrimarySkillId(
        skillId,
        questionsTakeNumber,
      );

    return questionEntities;
  }

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
