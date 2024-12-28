import { BadRequestException } from '@nestjs/common';
import { MessageTypeEnum, messages } from '../../../constants/message.enum';

export class IsNotAccepted extends BadRequestException {
  constructor() {
    super(messages[MessageTypeEnum.IS_NOT_ACCEPTED], MessageTypeEnum.IS_NOT_ACCEPTED);
  }
}
