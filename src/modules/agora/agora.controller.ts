import { AgoraAccessTokenDto } from './dtos/access-token.dto';
import { AgoraService } from './agora.service';
import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@Controller('agora')
@ApiTags('agora')
export class AgoraController {
  constructor(private agoraService: AgoraService) {}

  @Get('access-token')
  @ApiOkResponse({ type: AgoraAccessTokenDto })
  async getAccessToken(
    @Query('userId') userId: string,
  ): Promise<AgoraAccessTokenDto> {
    return this.agoraService.generateRTCToken('main', userId);
  }

}