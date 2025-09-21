import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Interview } from "./Interview";

@Index("vocab_score_pkey", ["vocabScoreId"], { unique: true })
@Entity("vocab_score", { schema: "public" })
export class VocabScore {
  @PrimaryGeneratedColumn({ type: "bigint", name: "vocab_score_id" })
  vocabScoreId: string;

  @Column("integer", { name: "vocabulary_score", nullable: true })
  vocabularyScore: number | null;

  @Column("integer", { name: "word_complexity_score", nullable: true })
  wordComplexityScore: number | null;

  @Column("integer", { name: "sentence_structure_score", nullable: true })
  sentenceStructureScore: number | null;

  @Column("timestamp without time zone", {
    name: "created_on",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date | null;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("bigint", { name: "interview_id", nullable: true })
  interviewId: string | null;

  @ManyToOne(() => Interview, (interview) => interview.vocabScores)
  @JoinColumn([{ name: "interview_id", referencedColumnName: "interviewId" }])
  interview: Interview;
}
