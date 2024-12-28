import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { EmailDto } from "./email.dto";

export class LoginDto extends EmailDto {
    @ApiProperty()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    password: string;
}
