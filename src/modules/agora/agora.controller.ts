import { AgoraAccessTokenDto } from './dtos/access-token.dto';
import { AgoraService } from './agora.service';
import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@Controller('agora')
@ApiTags('agora')
export class AgoraController {
  constructor(private agoraService: AgoraService) {}

  @Get('access-token')
//   @Auth([RoleType.USER])
  @ApiOkResponse({ type: AgoraAccessTokenDto })
  async getAccessToken(): Promise<AgoraAccessTokenDto> {
    return this.agoraService.generateRTCToken('main', 'askjdkasjkdjkasjkjk');
  }

}