import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("numbers_on_website_number_desc_key", ["numberDesc"], { unique: true })
@Index("numbers_on_website_pkey", ["numberId"], { unique: true })
@Index("numbers_on_website_number_name_key", ["numberName"], { unique: true })
@Entity("numbers_on_website", { schema: "public" })
export class NumbersOnWebsite {
  @PrimaryGeneratedColumn({ type: "bigint", name: "number_id" })
  numberId: string;

  @Column("bigint", { name: "number_value" })
  numberValue: string;

  @Column("text", { name: "number_name", unique: true })
  numberName: string;

  @Column("text", { name: "number_desc", unique: true })
  numberDesc: string;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("timestamp without time zone", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;
}
