import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Evaluation } from './Evaluation';

@Index('communication_scores_pkey', ['commScoreId'], { unique: true })
@Entity('communication_scores', { schema: 'public' })
export class CommunicationScores {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'comm_score_id' })
  commScoreId: string;

  @Column('integer', { name: 'accent_neutrality_score', nullable: true })
  accentNeutralityScore: number | null;

  @Column('integer', { name: 'grammar_score', nullable: true })
  grammarScore: number | null;

  @Column('integer', { name: 'clarity_score', nullable: true })
  clarityScore: number | null;

  @Column('integer', { name: 'disfluency_score', nullable: true })
  disfluencyScore: number | null;

  @Column('timestamp without time zone', {
    name: 'created_on',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdOn: Date | null;

  @Column('timestamp without time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('boolean', {
    name: 'is_deleted',
    nullable: true,
    default: () => 'false',
  })
  isDeleted: boolean | null;

  @Column('bigint', { name: 'evaluation_id', nullable: true })
  evaluationId: string | null;

  @ManyToOne(() => Evaluation, (evaluation) => evaluation.communicationScores)
  @JoinColumn([{ name: "evaluation_id", referencedColumnName: "evaluationId" }])
  evaluation: Evaluation;
}
