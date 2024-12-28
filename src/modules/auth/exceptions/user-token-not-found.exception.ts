import { NotFoundException } from '@nestjs/common';
import { MessageTypeEnum, messages } from '../../../constants/message.enum';

export class UserTokenNotFoundException extends NotFoundException {
  constructor() {
    super(messages[MessageTypeEnum.USER_TOKEN_NOT_FOUND], MessageTypeEnum.USER_TOKEN_NOT_FOUND);
  }
}
