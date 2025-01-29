import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { IsPositiveNumber } from "../../../decorators/is-positive-number.decorator";

export class CreateQuestionDto {
    @ApiProperty({ default: 1 })
    @Min(1)
    @Max(4)
    @IsPositiveNumber()
    difficulty: number;

    @ApiProperty({ default: 1 })
    @Min(1)
    @Max(4)
    @IsPositiveNumber()
    level: number;

    @ApiProperty()
    @IsNumber()
    primarySkillId: number;

    @ApiPropertyOptional({ default: 60 })
    @IsOptional()
    @Min(1)
    @Max(300)
    @IsPositiveNumber()
    timeToAnswer: number;

    @ApiProperty()
    @IsString()
    question: string;

    @ApiProperty()
    @IsString()
    answer: string;
}