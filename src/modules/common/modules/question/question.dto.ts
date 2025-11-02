import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Questions } from '../../../../entities/Questions';

export class QuestionDto {
  @ApiProperty()
  questionId: string;

  @ApiProperty()
  primarySkillId: number;

  @ApiProperty()
  skillName: string;

  @ApiProperty()
  subTech: string;

  @ApiProperty()
  difficultyLevel: number;

  @ApiProperty()
  questionText: string;

  @ApiProperty()
  timeToAnswer: number;

  @ApiPropertyOptional()
  questionImageS3Link: string;

  @ApiPropertyOptional()
  questionVideoS3Link: string;

  @ApiProperty()
  isCode: boolean;

  constructor(question: Questions, options: {isForAdmin?: boolean, isAccess?: boolean, isExtended?: boolean}) {
    this.questionId = question.questionId;
    this.primarySkillId = question.primarySkillId;
    this.skillName = question.primarySkill?.skillName;
    this.difficultyLevel = question.difficultyLevel;
    this.subTech = question.subTech;
    this.difficultyLevel = question.difficultyLevel;
    this.timeToAnswer = question.timeToAnswer;
    this.questionText = question.questionText;
    this.questionImageS3Link = question.questionImageS3Link;
    this.questionVideoS3Link = question.questionVideoS3Link;
    this.isCode = question.subTech.toLowerCase() === 'code'
  }
}
