import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Config } from "./Config";
import { Evaluation } from "./Evaluation";

@Index("emotion_score_pkey", ["emotionId"], { unique: true })
@Entity("emotion_score", { schema: "public" })
export class EmotionScore {
  @PrimaryGeneratedColumn({ type: "bigint", name: "emotion_id" })
  emotionId: string;

  @Column("numeric", {
    name: "emotion_score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  emotionScore: string | null;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("timestamp without time zone", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("bigint", { name: "login_id", nullable: true })
  loginId: string | null;

  // @ManyToOne(() => Config, (config) => config.emotionScores)
  // @JoinColumn([{ name: "config_id", referencedColumnName: "configId" }])
  // config: Config;

  // @ManyToOne(() => Evaluation, (evaluation) => evaluation.emotionScores)
  // @JoinColumn([{ name: "evaluation_id", referencedColumnName: "evaluationId" }])
  // evaluation: Evaluation;
}
