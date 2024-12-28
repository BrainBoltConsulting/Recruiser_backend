import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class IsExtendedDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({value}) => value === 'true' ? true : false)
  @IsBoolean()
  readonly isExtended: boolean;
}
