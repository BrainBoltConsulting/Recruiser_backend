import { Column, Entity, Index } from "typeorm";

@Index("schedule_pkey", ["candidateId"], { unique: true })
@Entity("schedule", { schema: "public" })
export class ScheduleEntity {
  @Column("date", { name: "created_on", nullable: true })
  createdOn: string | null;

  @Column("boolean", { name: "is_deleted", nullable: true })
  isDeleted: boolean | null;

  @Column("text", { primary: true, name: "candidate_id" })
  candidateId: string;

  @Column("date", { name: "sch_date", nullable: true })
  schDate: string | null;

  @Column("timestamp with time zone", { name: "sch_time", nullable: true })
  schTime: Date | null;

  @Column("text", { name: "meeting_link", nullable: true })
  meetingLink: string | null;

  @Column("timestamp with time zone", { name: "time_taken", nullable: true })
  timeTaken: Date | null;

  @Column("date", { name: "date_taken", nullable: true })
  dateTaken: string | null;
}
