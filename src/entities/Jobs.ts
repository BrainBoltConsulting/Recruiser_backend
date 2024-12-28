import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("jobs_pkey", ["jobId"], { unique: true })
@Entity("jobs", { schema: "public" })
export class JobsEntity {
  @Column("date", { name: "created_on" })
  createdOn: string;

  @Column("boolean", { name: "is_deleted" })
  isDeleted: boolean;

  @PrimaryGeneratedColumn({ type: "integer", name: "job_id" })
  jobId: number;

  @Column("text", { name: "job_title" })
  jobTitle: string;

  @Column("integer", { name: "years_of_exp", nullable: true })
  yearsOfExp: number | null;

  @Column("text", { name: "job_desc", nullable: true })
  jobDesc: string | null;

  @Column("text", { name: "skill1" })
  skill1: string;

  @Column("text", { name: "skill2", nullable: true })
  skill2: string | null;

  @Column("text", { name: "skill3", nullable: true })
  skill3: string | null;

  @Column("text", { name: "skill4", nullable: true })
  skill4: string | null;

  @Column("text", { name: "skill5", nullable: true })
  skill5: string | null;

  @Column("text", { name: "manager_id" })
  managerId: string;
}
