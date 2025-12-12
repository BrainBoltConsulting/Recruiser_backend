import { ApiProperty } from '@nestjs/swagger';

export class CognitoTokenResponseDto {
  @ApiProperty({
    description: 'Cognito ID token',
    example: 'eyJraWQiOiJcL1wv...',
  })
  idToken: string;

  @ApiProperty({
    description: 'Cognito Access token',
    example: 'eyJraWQiOiJcL1wv...',
  })
  accessToken: string;
}

