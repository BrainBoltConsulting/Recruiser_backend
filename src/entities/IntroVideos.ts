import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("intro_videos_pkey", ["introId"], { unique: true })
@Entity("intro_videos", { schema: "public" })
export class IntroVideos {
  @PrimaryGeneratedColumn({ type: "bigint", name: "intro_id" })
  introId: string;

  @Column("bigint", { name: "intro_sequence" })
  introSequence: string;

  @Column("text", { name: "intro_value", nullable: true })
  introValue: string | null;

  @Column("text", { name: "intro_description", nullable: true })
  introDescription: string | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;
}
