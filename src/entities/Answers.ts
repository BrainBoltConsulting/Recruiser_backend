import { Column, Entity, Index } from "typeorm";

@Index("Answers_pkey", ["answerId"], { unique: true })
@Entity("Answers", { schema: "public" })
export class AnswersEntity {
  @Column("text", { primary: true, name: "Answer_id" })
  answerId: string;

  @Column("text", { name: "Answer", nullable: true })
  answer: string | null;
}
