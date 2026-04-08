import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Candidate } from "./Candidate";
import { Jobs } from "./Jobs";

@Index("schedule_pkey", ["scheduleId"], { unique: true })
@Entity("schedule", { schema: "public" })
export class Schedule {
  @PrimaryGeneratedColumn({ type: "bigint", name: "schedule_id" })
  scheduleId: string;

  @Column("timestamp without time zone", {
    name: "scheduled_datetime",
    nullable: true,
  })
  scheduledDatetime: Date | null;

  @Column("text", { name: "meeting_link", nullable: true })
  meetingLink: string | null;

  @Column({ nullable: true, name: 'job_id' })
  jobId: string;

  @Column("uuid", { name: "j_uuid" })
  jUuid: string;

  @Column("timestamp without time zone", {
    name: "attended_datetime",
    nullable: true,
  })
  attendedDatetime: Date | null;

  @Column("timestamp without time zone", {
    name: "created_on",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column({ name: 'candidate_id', type: 'bigint' })
  candidateId: number;

  @Column('uuid', { name: 'c_uuid' })
  cUuid: string;

  @ManyToOne(() => Candidate, (candidate) => candidate.schedules)
  @JoinColumn([{ name: 'c_uuid', referencedColumnName: 'cUuid' }])
  candidate: Candidate;

  @ManyToOne(() => Jobs, (jobs) => jobs.schedules)
  @JoinColumn([{ name: "j_uuid", referencedColumnName: "jUuid" }])
  job: Jobs;
}
