import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { Role } from "../../../constants/role.enum";
import { StatusEnum } from "../../../constants/status.enum";
import { IsPhoneNumber } from "../../../decorators/custom-phone-number.decorator";

export class CreateUserByAdminDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    firstName: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    lastName: string

    @ApiProperty()
    @IsEmail()
    email: string

    @ApiProperty()
    @IsEnum(Role)
    role: Role;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    companyId: string;

    // @ApiPropertyOptional()
    // @IsOptional()
    // @IsPhoneNumber()
    // phoneNumber?: string 
}