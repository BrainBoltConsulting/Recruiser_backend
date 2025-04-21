import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { WeightMaster } from "./WeightMaster";

@Index("resume_score_calculator_pkey", ["resScoreCalId"], { unique: true })
@Entity("resume_score_calculator", { schema: "public" })
export class ResumeScoreCalculator {
  @PrimaryGeneratedColumn({ type: "bigint", name: "res_score_cal_id" })
  resScoreCalId: string;

  @Column("text", { name: "criteria__calc_desc", nullable: true })
  criteriaCalcDesc: string | null;

  @Column("text", { name: "criteria__calc_formula", nullable: true })
  criteriaCalcFormula: string | null;

  @Column("bigint", { name: "start_value" })
  startValue: string;

  @Column("bigint", { name: "increment_by" })
  incrementBy: string;

  @Column("bigint", { name: "max_value" })
  maxValue: string;

  @Column("timestamp without time zone", {
    name: "created_on",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @ManyToOne(
    () => WeightMaster,
    (weightMaster) => weightMaster.resumeScoreCalculators
  )
  @JoinColumn([{ name: "criteria_id", referencedColumnName: "criteriaId" }])
  criteria: WeightMaster;
}
