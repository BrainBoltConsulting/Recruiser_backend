import { Column, BeforeInsert } from 'typeorm';
import { DataSource } from 'typeorm';

export function CustomPrimaryGeneratedColumn(columnName: string) {
  return function (target: any, propertyKey: string) {
    // Apply the Column decorator for the custom primary key column
    Column({ type: 'text', primary: true, name: columnName })(target, propertyKey);

    // Add a custom method for primary key generation to the entity
    BeforeInsert()(target, 'generateCustomPrimaryKey');
  };
}
