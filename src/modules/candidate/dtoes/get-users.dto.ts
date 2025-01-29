import { ApiPropertyOptional } from "@nestjs/swagger";
import { PageOptionsDto } from "../../common/dtos/page-options.dto";
import { IsBoolean, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class GetUsersDto extends PageOptionsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({value}) => value === 'true' ? true : false)
    @IsBoolean()
    readonly isNewLead: boolean;
}