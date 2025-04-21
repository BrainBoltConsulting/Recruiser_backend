import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("report_comments_pkey", ["rcId"], { unique: true })
@Entity("report_comments", { schema: "public" })
export class ReportComments {
  @PrimaryGeneratedColumn({ type: "bigint", name: "rc_id" })
  rcId: string;

  @Column("integer", { name: "min_score" })
  minScore: number;

  @Column("integer", { name: "max_score" })
  maxScore: number;

  @Column("text", { name: "proficiency_level" })
  proficiencyLevel: string;

  @Column("text", { name: "description" })
  description: string;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("timestamp without time zone", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("text", { name: "criteria_id", nullable: true })
  criteriaId: string | null;
}
