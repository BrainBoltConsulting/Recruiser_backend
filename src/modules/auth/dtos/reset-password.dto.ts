import { ApiProperty } from '@nestjs/swagger';
import {   IsString, MaxLength, MinLength } from 'class-validator';
import {TokenDto} from "./token.dto";
import { IsPassword } from '../../../decorators/validation.decorator';

export class ResetPasswordDto extends TokenDto {
  @ApiProperty()
  @IsPassword()
  newPassword: string;
}