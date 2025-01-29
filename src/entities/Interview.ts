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
  interviewId: string;

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

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

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
