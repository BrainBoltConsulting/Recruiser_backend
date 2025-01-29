// import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
// import { Jobs } from "./Jobs";
// import { Skills } from "./Skills";

// @Entity("job_skills", { schema: "public" })
// export class JobSkills {
//   @Column("boolean", { name: "is_mandatory", default: () => "false" })
//   isMandatory: boolean;

//   @Column("timestamp without time zone", {
//     name: "created_on",
//     default: () => "CURRENT_TIMESTAMP",
//   })
//   createdOn: Date;

//   @Column("timestamp without time zone", { name: "updated_at", nullable: true })
//   updatedAt: Date | null;

//   @Column("boolean", { name: "is_deleted", default: () => "false" })
//   isDeleted: boolean;

//   @ManyToOne(() => Jobs, (jobs) => jobs.jobSkills)
//   @JoinColumn([{ name: "job_id", referencedColumnName: "jobId" }])
//   job: Jobs;

//   @ManyToOne(() => Skills, (skills) => skills.jobSkills)
//   @JoinColumn([{ name: "skill_id", referencedColumnName: "skillId" }])
//   skill: Skills;
// }
