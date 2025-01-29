import { NotFoundException } from '@nestjs/common';
import { messages, MessageTypeEnum } from '../../../constants/message.enum';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super(messages[MessageTypeEnum.USER_IS_NOT_FOUND], MessageTypeEnum.USER_IS_NOT_FOUND);
  }
}