import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';

export class SetPasswordDto extends ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}