import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { UsersEntity } from "./Users";

@Index("pk", ["candidateId", "questionId"], { unique: true })
@Entity("dishonest", { schema: "public" })
export class DishonestEntity {
  @Column("date", { name: "created_on" })
  createdOn: string;

  @Column("boolean", { name: "is_deleted" })
  isDeleted: boolean;

  @Column("text", { primary: true, name: "candidate_id" })
  candidateId: string;

  @Column("text", { primary: true, name: "question_id" })
  questionId: string;

  @Column("numeric", {
    name: "dish_score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  dishScore: string | null;

  @ManyToOne(() => UsersEntity, (users) => users.dishonests)
  @JoinColumn([{ name: "candidate_id", referencedColumnName: "userId" }])
  candidate: UsersEntity;
}
