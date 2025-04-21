import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ResumeScoreCalculator } from "./ResumeScoreCalculator";
import { ResumeScores } from "./ResumeScores";

@Index("job_score_criteria_pkey", ["criteriaId"], { unique: true })
@Entity("weight_master", { schema: "public" })
export class WeightMaster {
  @PrimaryGeneratedColumn({ type: "bigint", name: "criteria_id" })
  criteriaId: string;

  @Column("character varying", { name: "criterion_name", length: 255 })
  criterionName: string;

  @Column("integer", { name: "weight" })
  weight: number;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("timestamp without time zone", {
    name: "created_on",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("text", { name: "criteria" })
  criteria: string;

  @OneToMany(
    () => ResumeScoreCalculator,
    (resumeScoreCalculator) => resumeScoreCalculator.criteria
  )
  resumeScoreCalculators: ResumeScoreCalculator[];

  @OneToMany(() => ResumeScores, (resumeScores) => resumeScores.criteria)
  resumeScores: ResumeScores[];
}
