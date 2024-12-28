import { Column, Entity, Index } from "typeorm";

@Index("Questions_pkey", ["questionId"], { unique: true })
@Entity("Questions", { schema: "public" })
export class QuestionsEntity {
  @Column("text", { primary: true, name: "Question_id" })
  questionId: string;

  @Column("text", { name: "Answer_id", nullable: true })
  answerId: string | null;

  @Column("text", { name: "Tech_Primary", nullable: true })
  techPrimary: string | null;

  @Column("text", { name: "Tech_Sub", nullable: true })
  techSub: string | null;

  @Column("numeric", { name: "Question_difficulty", nullable: true })
  questionDifficulty: string | null;

  @Column("integer", { name: "Question_Level", nullable: true })
  questionLevel: number | null;

  @Column("integer", { name: "Time_to_Ans", nullable: true })
  timeToAns: number | null;

  @Column("text", { name: "Question", nullable: true })
  question: string | null;

  @Column("text", { name: "Code_File_Name", nullable: true })
  codeFileName: string | null;
}
