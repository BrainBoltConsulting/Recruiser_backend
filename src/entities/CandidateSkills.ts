import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { Candidate } from './Candidate';
import { Skills } from './Skills';

@Index('candidate_skills_pkey', ['candidateId', 'skillId'], { unique: true })
@Entity('candidate_skills', { schema: 'public' })
export class CandidateSkills {
  @Column('bigint', { primary: true, name: 'candidate_id' })
  candidateId: number;

  @Column('uuid', { name: 'c_uuid' })
  cUuid: string;

  @Column('integer', { primary: true, name: 'skill_id' })
  skillId: number;

  @Column('boolean', {
    name: 'is_primary',
    nullable: true,
    default: () => 'false',
  })
  isPrimary: boolean | null;

  @Column('integer', { name: 'last_used_year', nullable: true })
  lastUsedYear: number | null;

  @ManyToOne(() => Candidate, (candidate) => candidate.candidateSkills)
  @JoinColumn([{ name: 'c_uuid', referencedColumnName: 'cUuid' }])
  candidate: Candidate;

  @ManyToOne(() => Skills, (skills) => skills.candidateSkills)
  @JoinColumn([{ name: 'skill_id', referencedColumnName: 'skillId' }])
  skill: Skills;
}
