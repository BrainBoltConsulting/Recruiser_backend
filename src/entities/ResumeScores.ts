import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Candidate } from "./Candidate";
import { ResumeCriteriaMaster } from "./ResumeCriteriaMaster";
import { Jobs } from "./Jobs";

@Index("resume_scores_pkey", ["scoreId"], { unique: true })
@Entity("resume_scores", { schema: "public" })
export class ResumeScores {
  @PrimaryGeneratedColumn({ type: "bigint", name: "score_id" })
  scoreId: string;

  @Column("bigint", { name: "manager_id" })
  managerId: string;

  @Column("integer", { name: "score" })
  score: number;

  @Column("timestamp without time zone", {
    name: "created_on",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column({ name: 'candidate_id', type: 'bigint'})
  candidateId: number;

  @Column({ name: 'criteria_id', type: 'bigint'})
  criteriaId: number;

  @ManyToOne(() => Candidate, (candidate) => candidate.resumeScores)
  @JoinColumn([{ name: "candidate_id", referencedColumnName: "candidateId" }])
  candidate: Candidate;

  @ManyToOne(
    () => ResumeCriteriaMaster,
    (resumeCriteriaMaster) => resumeCriteriaMaster.resumeScores
  )
  @JoinColumn([{ name: "criteria_id", referencedColumnName: "criteriaId" }])
  criteria: ResumeCriteriaMaster;

  @ManyToOne(() => Jobs, (jobs) => jobs.resumeScores)
  @JoinColumn([{ name: "job_id", referencedColumnName: "jobId" }])
  job: Jobs;
}
