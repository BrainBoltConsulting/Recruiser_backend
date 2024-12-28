import { BadRequestException } from '@nestjs/common';
import { MessageTypeEnum, messages } from '../../../constants/message.enum';

export class UserAlreadyExistsException extends BadRequestException {
  constructor() {
    super(messages[MessageTypeEnum.USER_IS_ALREADY_EXISTS], MessageTypeEnum.USER_IS_ALREADY_EXISTS);
  }
}
