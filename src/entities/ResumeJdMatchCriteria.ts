import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("resume_jd_match_criteria_pkey", ["rjdMatchId"], { unique: true })
@Index("resume_jd_match_criteria_rjd_match_name_key", ["rjdMatchName"], {
  unique: true,
})
@Entity("resume_jd_match_criteria", { schema: "public" })
export class ResumeJdMatchCriteria {
  @PrimaryGeneratedColumn({ type: "integer", name: "rjd_match_id" })
  rjdMatchId: number;

  @Column("text", { name: "rjd_match_name", unique: true })
  rjdMatchName: string;
}
