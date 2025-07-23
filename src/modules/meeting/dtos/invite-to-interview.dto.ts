import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class InviteToInterviewDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    scheduledDate: Date;
}