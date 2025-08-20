import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ManagerRelationship } from './ManagerRelationship';

@Index('company_pkey', ['companyId'], { unique: true })
@Entity('company', { schema: 'public' })
export class Company {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'company_id' })
  companyId: string;

  @Column('text', { name: 'name' })
  name: string;

  @OneToMany(
    () => ManagerRelationship,
    (managerRelationship) => managerRelationship.company,
  )
  managerRelationships: ManagerRelationship[];
}
