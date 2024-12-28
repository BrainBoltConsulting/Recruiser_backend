import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UtilsProvider } from '../../../providers/utils.provider';
import type { AbstractDto } from '../dtos/abstract.dto';

type GetConstructorArgs<T> = T extends new (...args: infer U) => any
  ? U
  : never;


export abstract class AbstractEntity<DTO extends AbstractDto> {
  // @PrimaryGeneratedColumn('uuid')
  // id: string;

  // @CreateDateColumn({
  //   type: 'timestamp without time zone',
  //   name: 'created_at',
  // })
  // createdAt: Date;

  // @UpdateDateColumn({
  //   type: 'timestamp without time zone',
  //   name: 'updated_at',
  // })
  // updatedAt: Date;

  abstract dtoClass /*: new (entity: AbstractEntity /!*<T>*!/, options?: any) => T*/;

  toDto(options?: any): DTO {
    return UtilsProvider.toDto(this.dtoClass, this, options);
  }
}

