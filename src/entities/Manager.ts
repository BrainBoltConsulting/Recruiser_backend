import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("Manager_pkey", ["managerId"], { unique: true })
@Entity("Manager", { schema: "public" })
export class ManagerEntity {
  @Column("date", { name: "created_on" })
  createdOn: string;

  @Column("boolean", { name: "is_deleted" })
  isDeleted: boolean;

  @Column("text", { name: "pw" })
  pw: string;

  @PrimaryGeneratedColumn({ type: "integer", name: "manager_id" })
  managerId: number;

  @Column("text", { name: "mgr_email", nullable: true })
  mgrEmail: string | null;

  @Column("text", { name: "mgr_name", nullable: true })
  mgrName: string | null;
}
