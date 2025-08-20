import { Repository } from 'typeorm';

import { CustomRepository } from '../db/typeorm-ex.decorator';
import { Company } from '../entities/Company';

@CustomRepository(Company)
export class CompanyRepository extends Repository<Company> {
  async findByName(name: string): Promise<Company | null> {
    return this.createQueryBuilder('company')
      .where('company.name = :name', { name })
      .getOne();
  }

  async getAllSorted(): Promise<Company[]> {
    return this.createQueryBuilder('company')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  async findById(id: string): Promise<Company | null> {
    return this.createQueryBuilder('company')
      .where('company.companyId = :id', { id })
      .getOne();
  }
}
