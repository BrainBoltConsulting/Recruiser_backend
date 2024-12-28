import {AbstractDto} from "../../dtos/abstract.dto";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {UrlEntity} from "../../../shared/url.entity";

export class UrlDto extends AbstractDto {
    @ApiProperty()
    link: string;

    @ApiPropertyOptional()
    productId: string;

    @ApiPropertyOptional()
    userId: string;

    @ApiPropertyOptional()
    cloudFrontLink: string;

    constructor(url: any) {
        super(url);

        this.link = url.link;
        this.cloudFrontLink = url.cloudFrontLink;
        if (url.userId) {
            this.userId = url.userId;
        }
    }
}
