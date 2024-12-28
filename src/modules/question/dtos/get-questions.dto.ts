import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetQuestionsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  @ApiPropertyOptional()
  readonly difficulty: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  @ApiPropertyOptional()
  readonly level: number = 1;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly techPrimary: string;
}
