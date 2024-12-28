import { ApiProperty } from '@nestjs/swagger';
import { TokenTypeEnum } from '../../../constants/token-type.enum';
import { IsEnum, IsString } from 'class-validator';

export class UpsertUserTokenDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsEnum(TokenTypeEnum)
  type: TokenTypeEnum;
}
