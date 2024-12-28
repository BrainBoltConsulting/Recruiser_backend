import { QuestionsEntity } from './../../entities/Questions';
import { Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { Response } from 'express';
import { GetQuestionsDto } from './dtos/get-questions.dto';


@Controller('questions')
@ApiTags('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) { }

  @Get('')
  // @Auth([Role.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  async getAllQuestions(
    @Query() getQuestionsDto: GetQuestionsDto,
  ): Promise<QuestionsEntity[]> {
      return this.questionService.getAllQuestions(getQuestionsDto);
  }

  @Post('')
  @HttpCode(HttpStatus.OK)
  async createNewQuestion(
    @Query() getQuestionsDto: GetQuestionsDto,
  ): Promise<QuestionsEntity[]> {
      return this.questionService.getAllQuestions(getQuestionsDto);
  }


  // @Get(':id')
  // // @Auth([Role.SUPER_ADMIN])
  // @HttpCode(HttpStatus.OK)
  // async getUserById(
  //   @Param('id') id: string,
  // ): Promise<UserDto> {
  //     return this.UserService.getUserById(id);
  // }

  // @Delete(':id')
  // @Auth([Role.SUPER_ADMIN], { setUserSession: true})
  // @HttpCode(HttpStatus.OK)
  // async deleteUserById(
  //   @UUIDParam('id') id: string,
  // ): Promise<void> {
  //   return this.UserService.deleteUser(id);
  // }

  // @Put(':id/update-password')
  // @HttpCode(HttpStatus.OK)
  // async updateUserPassword(
  //   @UUIDParam('id') id: string,
  //   @AuthUser() user: UserDto,
  //   @Body() updateUserStatusDto: UpdatePasswordDto
  // ) {
  //   return this.UserService.updateUserPassword(id, user, updateUserStatusDto)
  // }

  // @Auth([Role.SUPER_ADMIN], { setUserSession: true})

  // @Get('')
  // async readQuestion(
  //   @Res() res: Response
  // ) {
  //   res.setHeader('Content-Type', 'audio/mpeg');
  //   res.setHeader(
  //     'Content-Disposition',
  //     'inline; filename="speech.mp3"',
  //   );
  //   return res.send(await this.questionService.readQuestionByPolly());
  // }
}
