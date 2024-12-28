import { IsEnum } from "class-validator";
import { Role } from "../../../constants/role.enum";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyUserIdentityDto {
    @ApiProperty()
    @IsEnum(Role)
    role: Role;
}