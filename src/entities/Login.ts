import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Candidate } from "./Candidate";
import { Manager } from "./Manager";

@Index("login_email_key", ["email"], { unique: true })
@Index("login_pkey", ["loginId"], { unique: true })
@Index("login_login_username_key", ["loginUsername"], { unique: true })
@Entity("login", { schema: "public" })
export class Login {
  @PrimaryGeneratedColumn({ type: "bigint", name: "login_id" })
  loginId: string;

  @Column("text", { name: "login_username", unique: true })
  loginUsername: string;

  @Column("text", { name: "login_password" })
  loginPassword: string;

  @Column("text", { name: "salt", nullable: true })
  salt: string | null;

  @Column("enum", {
    name: "role",
    nullable: true,
    enum: ["CANDIDATE", "ADMIN", "MANAGER", "RECRUITER"],
    default: "CANDIDATE",
  })
  role: "CANDIDATE" | "ADMIN" | "MANAGER" | "RECRUITER" | null;

  @Column("character varying", { name: "email", unique: true, length: 255 })
  email: string;

  @Column("text", { name: "password_reset_token", nullable: true })
  passwordResetToken: string | null;

  @Column("timestamp without time zone", {
    name: "token_expiry_timestamp",
    nullable: true,
  })
  tokenExpiryTimestamp: Date | null;

  @Column("integer", {
    name: "failed_login_attempts",
    nullable: true,
    default: () => "0",
  })
  failedLoginAttempts: number | null;

  @Column("boolean", {
    name: "account_locked",
    nullable: true,
    default: () => "false",
  })
  accountLocked: boolean | null;

  @Column("timestamp without time zone", { name: "last_login", nullable: true })
  lastLogin: Date | null;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @OneToMany(() => Candidate, (candidate) => candidate.login)
  candidates: Candidate[];

  @OneToMany(() => Manager, (manager) => manager.login)
  managers: Manager[];
}
