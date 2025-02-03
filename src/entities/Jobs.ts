import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { JobShortlistedProfiles } from "./JobShortlistedProfiles";
import { JobSkills } from "./JobSkills";
import { Manager } from "./Manager";
import { ResumeScores } from "./ResumeScores";
import { Schedule } from "./Schedule";

@Index("jobs_pkey", ["jobId"], { unique: true })
@Entity("jobs", { schema: "public" })
export class Jobs {
  @PrimaryGeneratedColumn({ type: "bigint", name: "job_id" })
  jobId: string;

  @Column("text", { name: "job_title" })
  jobTitle: string;

  @Column("integer", { name: "years_of_exp", nullable: true })
  yearsOfExp: number | null;

  @Column("text", { name: "job_desc", nullable: true })
  jobDesc: string | null;

  @Column("timestamp without time zone", {
    name: "created_on",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @OneToMany(
    () => JobShortlistedProfiles,
    (jobShortlistedProfiles) => jobShortlistedProfiles.job
  )
  jobShortlistedProfiles: JobShortlistedProfiles[];

  @OneToMany(() => JobSkills, (jobSkills) => jobSkills.job)
  jobSkills: JobSkills[];

  @ManyToOne(() => Manager, (manager) => manager.jobs)
  @JoinColumn([{ name: "manager_id", referencedColumnName: "managerId" }])
  manager: Manager;

  @OneToMany(() => ResumeScores, (resumeScores) => resumeScores.job)
  resumeScores: ResumeScores[];

  @OneToMany(() => Schedule, (schedule) => schedule.job)
  schedules: Schedule[];
}
