import { ApiProperty } from '@nestjs/swagger';
import { MessageTypeEnum } from '../../../../constants/message.enum';

export class MessageDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  messageType: MessageTypeEnum;
}