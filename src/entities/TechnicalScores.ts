import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Evaluation } from "./Evaluation";

@Index("technical_scores_pkey", ["techScoreId"], { unique: true })
@Entity("technical_scores", { schema: "public" })
export class TechnicalScores {
  @PrimaryGeneratedColumn({ type: "bigint", name: "tech_score_id" })
  techScoreId: string;

  @Column("integer", { name: "semantic_similarity_score", nullable: true })
  semanticSimilarityScore: number | null;

  @Column("integer", { name: "broad_topic_similarity_score", nullable: true })
  broadTopicSimilarityScore: number | null;

  @Column("timestamp without time zone", {
    name: "created_on",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("bigint", { name: "evaluation_id", nullable: true })
  evaluationId: string | null;

  @ManyToOne(() => Evaluation, (evaluation) => evaluation.technicalScores)
  @JoinColumn([{ name: "evaluation_id", referencedColumnName: "evaluationId" }])
  evaluation: Evaluation;
}
