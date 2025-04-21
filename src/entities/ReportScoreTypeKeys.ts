import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("report_score_type_keys_pkey", ["rstkId"], { unique: true })
@Entity("report_score_type_keys", { schema: "public" })
export class ReportScoreTypeKeys {
  @PrimaryGeneratedColumn({ type: "bigint", name: "rstk_id" })
  rstkId: string;

  @Column("text", { name: "key_name", nullable: true })
  keyName: string | null;

  @Column("text", { name: "score_type", nullable: true })
  scoreType: string | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;
}
