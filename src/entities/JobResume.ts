import { Column, Entity, Index } from "typeorm";

@Index("job_resume_pkey", ["jobId"], { unique: true })
@Entity("job_resume", { schema: "public" })
export class JobResumeEntity {
  @Column("date", { name: "created_on" })
  createdOn: string;

  @Column("boolean", { name: "is_deleted" })
  isDeleted: boolean;

  @Column("integer", { primary: true, name: "job_id" })
  jobId: number;

  @Column("integer", { name: "resume_id", nullable: true })
  resumeId: number | null;
}
