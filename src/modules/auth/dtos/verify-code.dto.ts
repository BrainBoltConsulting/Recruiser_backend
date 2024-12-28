import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  forVerifyAccount: boolean;
}
