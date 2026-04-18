import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty()
  @IsInt()
  primarySkillId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(3)
  difficulty: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  timeToAnswer: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  answer: string;
}
