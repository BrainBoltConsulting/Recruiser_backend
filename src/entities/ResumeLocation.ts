import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("resume_location_pkey", ["resumeId"], { unique: true })
@Entity("resume_location", { schema: "public" })
export class ResumeLocationEntity {
  @Column("date", { name: "created_on" })
  createdOn: string;

  @Column("boolean", { name: "is_deleted" })
  isDeleted: boolean;

  @PrimaryGeneratedColumn({ type: "integer", name: "resume_id" })
  resumeId: number;

  @Column("text", { name: "s3_key_resume", nullable: true })
  s3KeyResume: string | null;

  @PrimaryGeneratedColumn({ type: "integer", name: "photo_id" })
  photoId: number;

  @Column("text", { name: "s3_key_photo", nullable: true })
  s3KeyPhoto: string | null;

  @Column("text", { name: "candidate_id", nullable: true })
  candidateId: string | null;
}
