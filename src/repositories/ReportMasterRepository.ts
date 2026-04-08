import { Repository } from 'typeorm';

import { CustomRepository } from '../db/typeorm-ex.decorator';
import { ReportMaster } from '../entities/ReportMaster';

@CustomRepository(ReportMaster)
export class ReportMasterRepository extends Repository<ReportMaster> {
  async findByCUuid(cUuid: string): Promise<ReportMaster | null> {
    return this.createQueryBuilder('report_master')
      .where('report_master.cUuid = :cUuid', { cUuid })
      .andWhere(
        '(report_master.is_deleted IS NULL OR report_master.is_deleted = false)',
      )
      .orderBy('report_master.created_at', 'DESC')
      .getOne();
  }

  async findAllByCUuid(cUuid: string): Promise<ReportMaster[]> {
    return this.createQueryBuilder('report_master')
      .where('report_master.cUuid = :cUuid', { cUuid })
      .andWhere(
        '(report_master.is_deleted IS NULL OR report_master.is_deleted = false)',
      )
      .orderBy('report_master.created_at', 'DESC')
      .getMany();
  }
}
