import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ReportMaster } from './ReportMaster';

@Index('report_score_pkey', ['rsId'], { unique: true })
@Entity('report_score', { schema: 'public' })
export class ReportScore {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'rs_id' })
  rsId: string;

  @Column({ type: 'bigint', name: 'report_id' })
  reportId: string;

  @Column('integer', { name: 'ts', nullable: true })
  ts: number | null;

  @Column('integer', { name: 'cs', nullable: true })
  cs: number | null;

  @Column('integer', { name: 'js', nullable: true })
  js: number | null;

  @Column('integer', { name: 'ds', nullable: true })
  ds: number | null;

  @Column('text', { name: 'report_text', nullable: true })
  reportText: string | null;

  @Column('bigint', { name: 'report_bi', nullable: true })
  reportBi: string | null;

  @Column('integer', { name: 'report_int', nullable: true })
  reportInt: number | null;

  @Column('boolean', { name: 'report_bool', nullable: true })
  reportBool: boolean | null;

  @Column('text', { name: 'report_remarks', nullable: true })
  reportRemarks: string | null;

  @Column('timestamp without time zone', {
    name: 'created_on',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdOn: Date;

  @Column('timestamp without time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('boolean', { name: 'is_deleted', default: () => 'false' })
  isDeleted: boolean;

  @ManyToOne(() => ReportMaster, (reportMaster) => reportMaster.reportScores)
  @JoinColumn([{ name: 'report_id', referencedColumnName: 'reportId' }])
  reportMaster: ReportMaster;
}
