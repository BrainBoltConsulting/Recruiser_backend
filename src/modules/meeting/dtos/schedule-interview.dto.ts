import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ScheduleInterviewDto {
    @ApiProperty()
    @IsString()
    cUuid: string;

    @ApiProperty()
    @IsString()
    jUuid: string;
}