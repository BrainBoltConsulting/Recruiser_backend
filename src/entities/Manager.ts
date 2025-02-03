import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CandidateVerification } from "./CandidateVerification";
import { Interview } from "./Interview";
import { JobShortlistedProfiles } from "./JobShortlistedProfiles";
import { Jobs } from "./Jobs";
import { Login } from "./Login";

@Index("manager_manager_email_key", ["managerEmail"], { unique: true })
@Index("manager_pkey", ["managerId"], { unique: true })
@Entity("manager", { schema: "public" })
export class Manager {
  @PrimaryGeneratedColumn({ type: "bigint", name: "manager_id" })
  managerId: string;

  @Column("character varying", {
    name: "manager_email",
    unique: true,
    length: 255,
  })
  managerEmail: string;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("timestamp without time zone", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("character varying", { name: "phone_no", nullable: true, length: 15 })
  phoneNo: string | null;

  @Column("text", { name: "first_name", nullable: true })
  firstName: string | null;

  @Column("text", { name: "middle_name", nullable: true })
  middleName: string | null;

  @Column("text", { name: "last_name", nullable: true })
  lastName: string | null;

  @OneToMany(
    () => CandidateVerification,
    (candidateVerification) => candidateVerification.manager
  )
  candidateVerifications: CandidateVerification[];

  @OneToMany(() => Interview, (interview) => interview.manager)
  interviews: Interview[];

  @OneToMany(
    () => JobShortlistedProfiles,
    (jobShortlistedProfiles) => jobShortlistedProfiles.manager
  )
  jobShortlistedProfiles: JobShortlistedProfiles[];

  @OneToMany(() => Jobs, (jobs) => jobs.manager)
  jobs: Jobs[];

  @ManyToOne(() => Login, (login) => login.managers)
  @JoinColumn([{ name: "login_id", referencedColumnName: "loginId" }])
  login: Login;
}
