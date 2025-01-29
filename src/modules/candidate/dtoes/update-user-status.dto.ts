import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { StatusEnum } from "../../../constants/status.enum";

export class UpdateUserStatusDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(StatusEnum)
    status?: StatusEnum;
}