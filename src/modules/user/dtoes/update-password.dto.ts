import { ApiProperty     } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";
import { IsPassword } from "../../../decorators/validation.decorator";

export class UpdatePasswordDto {
    @ApiProperty()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    oldPassword: string;

    @ApiProperty()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    newPassword: string;

    @ApiProperty()
    @IsString()
    @IsPassword()
    confirmNewPassword: string;
}