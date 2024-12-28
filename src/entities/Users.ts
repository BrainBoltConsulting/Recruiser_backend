import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EvalEntity } from "./Eval";
import { DishonestEntity } from "./Dishonest";
import { IdMatchEntity } from "./IdMatch";

@Index("Candidates_pkey", ["userId"], { unique: true })
@Entity("Users", { schema: "public" })
export class UsersEntity {
  @PrimaryGeneratedColumn({ name: "User_Id" })
  userId: string;

  @Column("text", { name: "Name", nullable: true })
  name: string | null;

  @Column("text", { name: "Tech_Primary", nullable: true })
  techPrimary: string | null;

  @Column("text", { name: "Tech_2", nullable: true })
  tech_2: string | null;

  @Column("text", { name: "Tech_3", nullable: true })
  tech_3: string | null;

  @Column("text", { name: "Domain", nullable: true })
  domain: string | null;

  @Column("text", { name: "Level", nullable: true })
  level: string | null;

  @Column("text", { name: "Training_Result", nullable: true })
  trainingResult: string | null;

  @Column("numeric", {
    name: "Years_Exp",
    nullable: true,
    precision: 2,
    scale: 0,
  })
  yearsExp: string | null;

  @Column("text", { name: "Email", nullable: true })
  email: string | null;

  @Column("enum", {
    name: "Role",
    nullable: true,
    enum: ["CANDIDATE", "ADMIN"],
    default: "CANDIDATE",
  })
  role: "CANDIDATE" | "ADMIN" | null;

  @Column("boolean", { name: "fd_status", default: () => "false" })
  fdStatus: boolean;

  @Column("text", { name: "password", nullable: true })
  password: string | null;

  @OneToMany(() => EvalEntity, (evalEntity) => evalEntity.candidate)
  evals: EvalEntity[];

  @OneToMany(() => DishonestEntity, (dishonest) => dishonest.candidate)
  dishonests: DishonestEntity[];

  @OneToMany(() => IdMatchEntity, (idMatch) => idMatch.candidate)
  idMatches: IdMatchEntity[];
}
