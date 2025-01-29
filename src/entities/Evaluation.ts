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

@Index("evaluation_pkey", ["evaluationId"], { unique: true })
@Entity("evaluation", { schema: "public" })
export class Evaluation {
  @PrimaryGeneratedColumn({ type: "bigint", name: "evaluation_id" })
  evaluationId: string;

  @Column("text", { name: "asrfilename", nullable: true })
  asrfilename: string | null;

  @Column("numeric", {
    name: "semantic_similarity_score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  semanticSimilarityScore: string | null;

  @Column("numeric", {
    name: "broad_topic_sim_score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  broadTopicSimScore: string | null;

  @Column("numeric", {
    name: "grammar_score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  grammarScore: string | null;

  @Column("numeric", {
    name: "disfluency_score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  disfluencyScore: string | null;

  @Column("text", { name: "videofilename", nullable: true })
  videofilename: string | null;

  @Column("text", { name: "videofile_s3key", nullable: true })
  videofileS3key: string | null;

  @Column("text", { name: "asrfile_s3key", nullable: true })
  asrfileS3key: string | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @ManyToOne(() => Interview, (interview) => interview.evaluations)
  @JoinColumn([{ name: "interview_id", referencedColumnName: "interviewId" }])
  interview: Interview;

  @ManyToOne(() => Questions, (questions) => questions.evaluations)
  @JoinColumn([{ name: "question_id", referencedColumnName: "questionId" }])
  question: Questions;
}
