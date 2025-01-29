import { CreateQuestionDto } from './dtos/create-question.dto';
import { Questions } from '../../entities/Questions';
import { Controller, Get, HttpCode, HttpStatus, Post, Query, Res, Body, Delete, Param, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { Response } from 'express';
import { GetQuestionsDto } from './dtos/get-questions.dto';


@Controller('questions')
@ApiTags('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) { }

  @Get('')
  @HttpCode(HttpStatus.OK)
  async getAllQuestions(
    @Query() getQuestionsDto: GetQuestionsDto,
  ): Promise<Questions[]> {
      return this.questionService.getAllQuestions(getQuestionsDto);
  }

  @Post('')
  @HttpCode(HttpStatus.OK)
  async createNewQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<any> {
      return this.questionService.createNewQuestion(createQuestionDto);
  }

  @Get(':id/voice')
  async getSingleQuestionsVoice(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
    
    return res.send(await this.questionService.getSingleQuestionsVoice(id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteQuestionById(
    @Param('id') id: string 
  ): Promise<void> {
    return this.questionService.deleteQuestionById(id)
  }
}
