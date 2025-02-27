import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiConfigService } from '../../shared/services/api-config.service';
import agoraAccessToken from 'agora-access-token';


@Injectable()
export class AgoraService {
  constructor(
    private configService: ApiConfigService,
  ) {}

  async generateRTCToken(channelName: string, uid: string) {
    const rtcRole = agoraAccessToken.RtcRole.PUBLISHER;

    if (!channelName) {
      throw new BadRequestException('Channel name is required');
    }

    if (!uid) {
      throw new BadRequestException('UID is required');
    }

    const expireTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    const accessToken = agoraAccessToken.RtcTokenBuilder.buildTokenWithAccount(
        this.configService.agoraConfig.appId,
        this.configService.agoraConfig.appCertificate,
        channelName,
        uid,
        rtcRole,
        privilegeExpireTime,
    );

    return { accessToken }
  }
 
}
