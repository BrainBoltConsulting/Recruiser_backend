import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Dishonest } from "./Dishonest";
import { Evaluation } from "./Evaluation";
import { Candidate } from "./Candidate";
import { Manager } from "./Manager";

@Index("interview_pkey", ["interviewId"], { unique: true })
@Entity("interview", { schema: "public" })
export class Interview {
  @PrimaryGeneratedColumn({ type: "bigint", name: "interview_id" })
  interviewId: number;

  @Column("timestamp without time zone", {
    name: "interview_date",
    nullable: true,
  })
  interviewDate: Date | null;

  @Column("text", { name: "remarks", nullable: true })
  remarks: string | null;

  @Column("timestamp without time zone", {
    name: "created_on",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date;

  @Column({ nullable: true, name: 'candidate_id' })
  candidateId: number;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("boolean", {
    name: "is_interview_finished_earlier",
    nullable: true,
    default: () => "false",
  })
  isInterviewFinishedEarlier: boolean | null;

  @Column("text", { name: "browser_name", nullable: true })
  browserName: string | null;

  @Column("text", { name: "videofile_s3key", nullable: true })
  videofileS3key: string | null;

  @OneToMany(() => Dishonest, (dishonest) => dishonest.interview)
  dishonests: Dishonest[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.interview)
  evaluations: Evaluation[];

  @ManyToOne(() => Candidate, (candidate) => candidate.interviews)
  @JoinColumn([{ name: "candidate_id", referencedColumnName: "candidateId" }])
  candidate: Candidate;

  @ManyToOne(() => Manager, (manager) => manager.interviews)
  @JoinColumn([{ name: "manager_id", referencedColumnName: "managerId" }])
  manager: Manager;
}
