import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class StartInterviewDto {
    @ApiProperty()
    @IsString()
    browserName: string;
}