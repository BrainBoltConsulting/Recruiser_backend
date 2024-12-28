import { QuestionsRepository } from './../../repositories/QuestionsRepository';
import { PollyService } from './../../shared/services/aws-polly.service';
import { Injectable } from '@nestjs/common';
import { S3Service } from '../../shared/services/aws-s3.service';
import { GetQuestionsDto } from './dtos/get-questions.dto';

@Injectable()
export class QuestionService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly pollyService: PollyService,
    private readonly questionsRepository: QuestionsRepository
  ) {}

  async getAllQuestions(getQuestionsDto: GetQuestionsDto) {
    return this.questionsRepository.getAllSorted()
  }


  async readQuestionByPolly() {
    return this.pollyService.generateSpeechStream('What is encapsulation in Javascript?')
  }

}
