import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Candidate } from "./Candidate";
import { Jobs } from "./Jobs";
import { Manager } from "./Manager";

@Index("job_shortlisted_profiles_pkey", ["shortlistId"], { unique: true })
@Entity("job_shortlisted_profiles", { schema: "public" })
export class JobShortlistedProfiles {
  @PrimaryGeneratedColumn({ type: "bigint", name: "shortlist_id" })
  shortlistId: string;

  @Column("timestamp without time zone", {
    name: "shortlisted_date",
    nullable: true,
  })
  shortlistedDate: Date | null;

  @Column("text", { name: "remarks", nullable: true })
  remarks: string | null;

  @Column("timestamp without time zone", {
    name: "created_on",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdOn: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("uuid", { name: "c_uuid" })
  cUuid: string;

  @ManyToOne(() => Candidate, (candidate) => candidate.jobShortlistedProfiles)
  @JoinColumn([{ name: "c_uuid", referencedColumnName: "cUuid" }])
  candidate: Candidate;

  @Column("uuid", { name: "j_uuid" })
  jUuid: string;

  @ManyToOne(() => Jobs, (jobs) => jobs.jobShortlistedProfiles)
  @JoinColumn([{ name: "j_uuid", referencedColumnName: "jUuid" }])
  job: Jobs;

  @ManyToOne(() => Manager, (manager) => manager.jobShortlistedProfiles)
  @JoinColumn([{ name: "manager_id", referencedColumnName: "managerId" }])
  manager: Manager;
}
