import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Login } from "./Login";
import { CandidateSkills } from "./CandidateSkills";
// import { CandidateVerification } from "./CandidateVerification";
import { Interview } from "./Interview";
import { JobShortlistedProfiles } from "./JobShortlistedProfiles";
import { ResumeScores } from "./ResumeScores";
import { Schedule } from "./Schedule";

@Index("candidate_pkey", ["candidateId"], { unique: true })
@Index("candidate_email_key", ["email"], { unique: true })
@Entity("candidate", { schema: "public" })
export class Candidate {
  @PrimaryGeneratedColumn({ type: "bigint", name: "candidate_id" })
  candidateId: string;

  @Column("text", { name: "domain", nullable: true })
  domain: string | null;

  @Column("text", { name: "level", nullable: true })
  level: string | null;

  @Column("text", { name: "training_result", nullable: true })
  trainingResult: string | null;

  @Column("integer", { name: "years_exp", nullable: true })
  yearsExp: number | null;

  @Column("text", { name: "email", unique: true })
  email: string;

  @Column("boolean", { name: "fd_status", default: () => "false" })
  fdStatus: boolean;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("text", { name: "s3_key_resume", nullable: true })
  s3KeyResume: string | null;

  @Column("text", { name: "s3_key_photo", nullable: true })
  s3KeyPhoto: string | null;

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

  @Column()
  loginId: string;

  @ManyToOne(() => Login, (login) => login.candidates)
  @JoinColumn([{ name: "login_id", referencedColumnName: "loginId" }])
  login: Login;

  @OneToMany(
    () => CandidateSkills,
    (candidateSkills) => candidateSkills.candidate
  )
  candidateSkills: CandidateSkills[];

  // @OneToMany(
  //   () => CandidateVerification,
  //   (candidateVerification) => candidateVerification.candidate
  // )
  // candidateVerifications: CandidateVerification[];

  @OneToMany(() => Interview, (interview) => interview.candidate)
  interviews: Interview[];

  @OneToMany(
    () => JobShortlistedProfiles,
    (jobShortlistedProfiles) => jobShortlistedProfiles.candidate
  )
  jobShortlistedProfiles: JobShortlistedProfiles[];

  @OneToMany(() => ResumeScores, (resumeScores) => resumeScores.candidate)
  resumeScores: ResumeScores[];

  @OneToMany(() => Schedule, (schedule) => schedule.candidate)
  schedules: Schedule[];
}
