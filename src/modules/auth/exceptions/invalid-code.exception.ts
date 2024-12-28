import { BadRequestException } from '@nestjs/common';
import { MessageTypeEnum, messages } from '../../../constants/message.enum';

export class InvalidCodeException extends BadRequestException {
  constructor() {
    super(messages[MessageTypeEnum.INVALID_CODE], MessageTypeEnum.INVALID_CODE);
  }
}
