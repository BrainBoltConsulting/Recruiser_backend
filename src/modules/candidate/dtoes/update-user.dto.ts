import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Role } from "../../../constants/role.enum";
import { StatusEnum } from "../../../constants/status.enum";
import { IsPhoneNumber } from "../../../decorators/custom-phone-number.decorator";

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    firstName?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    lastName?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    department?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(StatusEnum)
    status?: StatusEnum;

    @ApiPropertyOptional()
    @IsOptional()
    @IsPhoneNumber()
    phoneNumber?: string 
}