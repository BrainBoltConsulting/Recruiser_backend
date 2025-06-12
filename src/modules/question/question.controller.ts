import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { ApiFile } from '../../decorators/swagger.decorator';
import type { Questions } from '../../entities/Questions';
import { FileSizeGuard } from '../../guards/file-size.guard';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { GetQuestionsDto } from './dtos/get-questions.dto';
import { QuestionService } from './question.service';

@Controller('questions')
@ApiTags('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  async getAllQuestions(@Query() getQuestionsDto: GetQuestionsDto) {
    return this.questionService.getAllQuestions(getQuestionsDto);
  }

  @Post('')
  @UseGuards(new FileSizeGuard(10 * 1024 * 1024))
  @ApiFile([{ name: 'videoFile' }], {
    okResponseData: {
      description: 'Create new question',
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'videoFile', maxCount: 1 }]))
  @HttpCode(HttpStatus.OK)
  async createNewQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
    @UploadedFiles() files?: { videoFile?: Express.Multer.File[] },
  ): Promise<Questions> {
    return this.questionService.createNewQuestion(createQuestionDto, files);
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
  async deleteQuestionById(@Param('id') id: string): Promise<void> {
    return this.questionService.deleteQuestionById(id);
  }
}
