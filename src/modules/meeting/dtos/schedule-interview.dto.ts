import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsDateString, IsString } from "class-validator";

export class ScheduleInterviewDto {
    @ApiProperty()
    @IsString()
    candidateId: string;
}