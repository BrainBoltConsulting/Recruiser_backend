import { UnauthorizedException } from '@nestjs/common';
import { MessageTypeEnum, messages } from '../../../constants/message.enum';


export class UserIsNotActiveException extends UnauthorizedException {
  constructor() {
    super(
      `${messages[MessageTypeEnum.USER_IS_NOT_ACTIVE]}`,
      MessageTypeEnum.USER_IS_NOT_ACTIVE,
    );
  }
}
