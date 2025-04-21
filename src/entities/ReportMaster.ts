import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Candidate } from "./Candidate";

@Index("report_master_pkey", ["reportId"], { unique: true })
@Entity("report_master", { schema: "public" })
export class ReportMaster {
  @PrimaryGeneratedColumn({ type: "bigint", name: "report_id" })
  reportId: string;

  @Column("text", { name: "report_s3key", nullable: true })
  reportS3key: string | null;

  @Column("boolean", {
    name: "is_deleted",
    nullable: true,
    default: () => "false",
  })
  isDeleted: boolean | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  // @ManyToOne(() => Candidate, (candidate) => candidate.reportMasters)
  // @JoinColumn([{ name: "candidate_id", referencedColumnName: "candidateId" }])
  // candidate: Candidate;
}
