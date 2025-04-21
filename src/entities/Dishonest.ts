import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Interview } from "./Interview";
import { Questions } from "./Questions";

@Index("dishonest_pkey", ["dishonestId"], { unique: true })
@Entity("dishonest", { schema: "public" })
export class Dishonest {
  @PrimaryGeneratedColumn({ type: "bigint", name: "dishonest_id" })
  dishonestId: string;

  @Column("numeric", {
    name: "dishonest_score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  dishonestScore: string | null;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column({ nullable: true, name: 'interview_id' })
  interviewId: number;

  @Column({ nullable: true, name: 'question_id' })
  questionId: string;

  @Column("numeric", {
    name: "switch_count",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  switchCount: number | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @ManyToOne(() => Interview, (interview) => interview.dishonests)
  @JoinColumn([{ name: "interview_id", referencedColumnName: "interviewId" }])
  interview: Interview;

  @ManyToOne(() => Questions, (questions) => questions.dishonests)
  @JoinColumn([{ name: "question_id", referencedColumnName: "questionId" }])
  question: Questions;
}
