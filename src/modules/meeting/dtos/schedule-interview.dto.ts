import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ScheduleInterviewDto {
    @ApiProperty()
    @IsString()
    candidateId: string;

    @ApiProperty()
    @IsString()
    jobId: string;
}