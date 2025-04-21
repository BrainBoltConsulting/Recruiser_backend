import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("formulas_pkey", ["formulaId"], { unique: true })
@Entity("formulas", { schema: "public" })
export class Formulas {
  @PrimaryGeneratedColumn({ type: "bigint", name: "formula_id" })
  formulaId: string;

  @Column("text", { name: "formula_name", nullable: true })
  formulaName: string | null;

  @Column("text", { name: "formula_expression", nullable: true })
  formulaExpression: string | null;

  @Column("text", { name: "formula_description", nullable: true })
  formulaDescription: string | null;

  @Column("text", { name: "sql_calculation", nullable: true })
  sqlCalculation: string | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;
}
