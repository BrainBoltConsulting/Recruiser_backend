import { IsString } from 'class-validator';

export class AgoraAccessTokenDto {
  @IsString()
  accessToken: string;
}