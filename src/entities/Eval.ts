import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { UsersEntity } from "./Users";

@Index("evals_pkey", ["evalId"], { unique: true })
@Entity("Eval", { schema: "public" })
export class EvalEntity {
  @Column("text", { name: "Interview_Dat", nullable: true })
  interviewDat: string | null;

  @Column("text", { name: "ASRFileName", nullable: true })
  asrFileName: string | null;

  @Column("text", { name: "Question_ID", nullable: true })
  questionId: string | null;

  @Column("numeric", {
    name: "Semantic_Similarity_Score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  semanticSimilarityScore: string | null;

  @Column("numeric", {
    name: "Broad_Topic_Sim_Score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  broadTopicSimScore: string | null;

  @Column("numeric", {
    name: "Grammar_Score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  grammarScore: string | null;

  @Column("numeric", {
    name: "Disfluency_Score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  disfluencyScore: string | null;

  @Column("text", { name: "VideoFileName", nullable: true })
  videoFileName: string | null;

  @Column("text", { primary: true, name: "Eval_Id" })
  evalId: string;

  @ManyToOne(() => UsersEntity, (users) => users.evals)
  @JoinColumn([{ name: "Candidate_id", referencedColumnName: "userId" }])
  candidate: UsersEntity;
}
