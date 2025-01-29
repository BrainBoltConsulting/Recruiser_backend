import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Max, Min } from "class-validator";
import { IsPositiveNumber } from "../../../decorators/is-positive-number.decorator";

export class CreateSkillDto {
    @ApiProperty()
    @IsString()
    skillName: string;
}