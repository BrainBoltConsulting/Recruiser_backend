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
    console.log(await this.s3Service.generatePreSignedUrl('question_images/1.png'))
    return (await this.questionsRepository.getAllSorted()).toDtos();
  }

  async getSingleQuestionsVoice(id: string) {
    const questionEntity = await this.questionsRepository.findById(id);
    
    return this.readQuestionByPolly(questionEntity.questionText);
  }

  @Transactional()
  async createNewQuestion(createQuestionDto: CreateQuestionDto) {
    console.log(createQuestionDto);
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
    console.log(question)
    return this.pollyService.generateSpeechStream(question);
  }

  async getQuestionsBySkill(skillId: number) {
    const questionEntities = await this.questionsRepository.findByPrimarySkillId(skillId);

    return questionEntities;
  }

}
