import { Repository } from 'typeorm';

import { CustomRepository } from '../db/typeorm-ex.decorator';
import { ReportMaster } from '../entities/ReportMaster';

@CustomRepository(ReportMaster)
export class ReportMasterRepository extends Repository<ReportMaster> {
  async findByCandidateId(candidateId: number): Promise<ReportMaster | null> {
    return this.createQueryBuilder('report_master')
      .where('report_master.candidate_id = :candidateId', { candidateId })
      .andWhere(
        '(report_master.is_deleted IS NULL OR report_master.is_deleted = false)',
      )
      .orderBy('report_master.created_at', 'DESC')
      .getOne();
  }

  async findAllByCandidateId(candidateId: number): Promise<ReportMaster[]> {
    return this.createQueryBuilder('report_master')
      .where('report_master.candidate_id = :candidateId', { candidateId })
      .andWhere(
        '(report_master.is_deleted IS NULL OR report_master.is_deleted = false)',
      )
      .orderBy('report_master.created_at', 'DESC')
      .getMany();
  }
}
