import { UnauthorizedException } from '@nestjs/common';
import { MessageTypeEnum, messages } from '../../../constants/message.enum';


export class UserUnauthenticatedException extends UnauthorizedException {
  constructor(description?: string) {
    super(
      `${messages[MessageTypeEnum.USER_UNAUTHENTICATED]}.${description ? ' ' + description : ''}`,
      MessageTypeEnum.USER_UNAUTHENTICATED,
    );
  }
}
