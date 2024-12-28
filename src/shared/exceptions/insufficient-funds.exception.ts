import { BadRequestException } from '@nestjs/common';

export class InsufficientFundsException extends BadRequestException {
  constructor() {
    super('Insufficient funds', 'insufficient_funds');
  }
}
