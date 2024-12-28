import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('api')
@ApiTags('api')
export class AppController {
    @Get('/ping')
    @HttpCode(HttpStatus.OK)
    async healthCheck() {
        return 'pong';
    }

}
