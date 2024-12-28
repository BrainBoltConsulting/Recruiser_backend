import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { UsersEntity } from "./Users";

@Index("pkim", ["candidateId", "photoId"], { unique: true })
@Entity("id_match", { schema: "public" })
export class IdMatchEntity {
  @Column("date", { name: "created_on" })
  createdOn: string;

  @Column("boolean", { name: "is_deleted" })
  isDeleted: boolean;

  @Column("text", { primary: true, name: "candidate_id" })
  candidateId: string;

  @Column("text", { primary: true, name: "photo_id" })
  photoId: string;

  @Column("numeric", {
    name: "match_score",
    nullable: true,
    precision: 3,
    scale: 0,
  })
  matchScore: string | null;

  @ManyToOne(() => UsersEntity, (users) => users.idMatches)
  @JoinColumn([{ name: "candidate_id", referencedColumnName: "userId" }])
  candidate: UsersEntity;
}
