import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Company } from './Company';
import { Manager } from './Manager';

@Index(
  'manager_relationship_pkey',
  ['companyId', 'managerId', 'reportsToManagerId'],
  { unique: true },
)
@Entity('manager_relationship', { schema: 'public' })
export class ManagerRelationship {
  @PrimaryColumn({ type: 'bigint', name: 'company_id' })
  companyId: string;

  @PrimaryColumn({ type: 'bigint', name: 'manager_id' })
  managerId: string;

  @PrimaryColumn({ type: 'bigint', name: 'reports_to_manager_id' })
  reportsToManagerId: string;

  @ManyToOne(() => Company, (company) => company.managerRelationships)
  @JoinColumn([{ name: 'company_id', referencedColumnName: 'companyId' }])
  company: Company;

  @ManyToOne(() => Manager, (manager) => manager.managerRelationships)
  @JoinColumn([{ name: 'manager_id', referencedColumnName: 'managerId' }])
  manager: Manager;

  @ManyToOne(() => Manager, (manager) => manager.reportsToManagerRelationships)
  @JoinColumn([
    { name: 'reports_to_manager_id', referencedColumnName: 'managerId' },
  ])
  reportsToManager: Manager;
}
