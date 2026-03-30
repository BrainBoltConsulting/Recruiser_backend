import { Repository } from 'typeorm';

import { CustomRepository } from '../db/typeorm-ex.decorator';
import { ReportScore } from '../entities/ReportScore';

@CustomRepository(ReportScore)
export class ReportScoreRepository extends Repository<ReportScore> {
  async findByReportId(reportId: string): Promise<ReportScore[]> {
    return this.createQueryBuilder('report_score')
      .where('report_score.report_id = :reportId', { reportId })
      .andWhere('report_score.is_deleted = :isDeleted', { isDeleted: false })
      .getMany();
  }
}
