import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';
import { CompletionReasonEnum } from '../../../constants/completion-reason.enum';

export class IsInterviewFinishedEarlierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : false))
  @IsBoolean()
  readonly isInterviewFinishedEarlier: boolean;

  @ApiPropertyOptional({ 
    description: 'Reason for interview completion',
    enum: CompletionReasonEnum,
    example: CompletionReasonEnum.NORMAL
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(CompletionReasonEnum))
  readonly completionReason?: CompletionReasonEnum;
}
