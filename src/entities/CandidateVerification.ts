// import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
// import { Candidate } from "./Candidate";
// import { Manager } from "./Manager";

// @Index("candidate_verification_pkey", ["candidateId", "managerId"], { unique: true })
// @Entity("candidate_verification", { schema: "public" })
// export class CandidateVerification {
//   @Column("numeric", {
//     name: "match_score",
//     nullable: true,
//     precision: 3,
//     scale: 0,
//   })
//   matchScore: string | null;

//   @Column("text", { name: "verification_mode", nullable: true })
//   verificationMode: string | null;

//   @Column("text", { name: "verification_remarks", nullable: true })
//   verificationRemarks: string | null;

//   @Column("timestamp without time zone", {
//     name: "verification_date",
//     nullable: true,
//   })
//   verificationDate: Date | null;

//   @ManyToOne(() => Candidate, (candidate) => candidate.candidateVerifications)
//   @JoinColumn([{ name: "candidate_id", referencedColumnName: "candidateId" }])
//   candidate: Candidate;

//   @ManyToOne(() => Manager, (manager) => manager.candidateVerifications)
//   @JoinColumn([{ name: "manager_id", referencedColumnName: "managerId" }])
//   manager: Manager;
// }
