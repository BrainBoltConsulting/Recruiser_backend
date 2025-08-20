import { Repository } from 'typeorm';

import { CustomRepository } from '../db/typeorm-ex.decorator';
import { ManagerRelationship } from '../entities/ManagerRelationship';

@CustomRepository(ManagerRelationship)
export class ManagerRelationshipRepository extends Repository<ManagerRelationship> {
  async findByCompanyId(companyId: string): Promise<ManagerRelationship[]> {
    return this.createQueryBuilder('managerRelationship')
      .leftJoinAndSelect('managerRelationship.manager', 'manager')
      .leftJoinAndSelect(
        'managerRelationship.reportsToManager',
        'reportsToManager',
      )
      .where('managerRelationship.companyId = :companyId', { companyId })
      .getMany();
  }

  async findByManagerId(managerId: string): Promise<ManagerRelationship[]> {
    return this.createQueryBuilder('managerRelationship')
      .leftJoinAndSelect('managerRelationship.company', 'company')
      .leftJoinAndSelect(
        'managerRelationship.reportsToManager',
        'reportsToManager',
      )
      .where('managerRelationship.managerId = :managerId', { managerId })
      .getMany();
  }

  async findByReportsToManagerId(
    reportsToManagerId: string,
  ): Promise<ManagerRelationship[]> {
    return this.createQueryBuilder('managerRelationship')
      .leftJoinAndSelect('managerRelationship.company', 'company')
      .leftJoinAndSelect('managerRelationship.manager', 'manager')
      .where('managerRelationship.reportsToManagerId = :reportsToManagerId', {
        reportsToManagerId,
      })
      .getMany();
  }

  async findByCompanyAndManager(
    companyId: string,
    managerId: string,
  ): Promise<ManagerRelationship[]> {
    return this.createQueryBuilder('managerRelationship')
      .leftJoinAndSelect(
        'managerRelationship.reportsToManager',
        'reportsToManager',
      )
      .where('managerRelationship.companyId = :companyId', { companyId })
      .andWhere('managerRelationship.managerId = :managerId', { managerId })
      .getMany();
  }

  async getAllSorted(): Promise<ManagerRelationship[]> {
    return this.createQueryBuilder('managerRelationship')
      .leftJoinAndSelect('managerRelationship.company', 'company')
      .leftJoinAndSelect('managerRelationship.manager', 'manager')
      .leftJoinAndSelect(
        'managerRelationship.reportsToManager',
        'reportsToManager',
      )
      .orderBy('company.name', 'ASC')
      .addOrderBy('manager.firstName', 'ASC')
      .getMany();
  }
}
