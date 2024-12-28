import type { IAbstract } from '../interfaces/IAbstract';

export class AbstractDto {
  id: string;

  updatedAt: Date;

  createdAt: Date;

  constructor(entity: IAbstract<AbstractDto>) {
    this.id = entity.id;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
