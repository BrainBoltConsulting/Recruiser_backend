import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CandidateSkills } from "./CandidateSkills";
import { JobSkills } from "./JobSkills";
import { Questions } from "./Questions";

@Index("skills_pkey", ["skillId"], { unique: true })
@Index("skills_skill_name_key", ["skillName"], { unique: true })
@Entity("skills", { schema: "public" })
export class Skills {
  @PrimaryGeneratedColumn({ type: "integer", name: "skill_id" })
  skillId: number;

  @Column("text", { name: "skill_name", unique: true })
  skillName: string;

  @OneToMany(() => CandidateSkills, (candidateSkills) => candidateSkills.skill)
  candidateSkills: CandidateSkills[];

  @OneToMany(() => JobSkills, (jobSkills) => jobSkills.skill)
  jobSkills: JobSkills[];

  @OneToMany(() => Questions, (questions) => questions.primarySkill)
  questions: Questions[];
}
