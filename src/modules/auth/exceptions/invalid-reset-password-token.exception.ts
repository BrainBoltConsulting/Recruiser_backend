import { NotAcceptableException } from '@nestjs/common';
import { MessageTypeEnum, messages } from '../../../constants/message.enum';


export class InvalidResetPasswordTokenException extends NotAcceptableException {
  constructor() {
    super(messages[MessageTypeEnum.INVALID_RESET_PASSWORD_TOKEN], MessageTypeEnum.INVALID_RESET_PASSWORD_TOKEN);
  }
}
