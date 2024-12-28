import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("resume_pkey", ["resumeId"], { unique: true })
@Entity("resume", { schema: "public" })
export class ResumeEntity {
  @Column("date", { name: "created_on" })
  createdOn: string;

  @Column("boolean", { name: "is_deleted" })
  isDeleted: boolean;

  @Column("text", { name: "manager_id" })
  managerId: string;

  @Column("text", { name: "Candidate_id" })
  candidateId: string;

  @PrimaryGeneratedColumn({ type: "integer", name: "resume_id" })
  resumeId: number;
}
