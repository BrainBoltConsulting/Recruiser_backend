import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

/**
 * POST /questions uses multipart/form-data (videoFile + fields). Form fields arrive
 * as strings; @Type(() => Number) + global ValidationPipe `transform: true` coerces
 * them before @IsInt() runs.
 */
export class CreateQuestionDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  primarySkillId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  difficulty: number;

  @ApiProperty()
  @Type(() => Number)
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
