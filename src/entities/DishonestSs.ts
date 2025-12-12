import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Evaluation } from './Evaluation';

@Index('dishonest_ss_pkey', ['ssId'], { unique: true })
@Entity('dishonest_ss', { schema: 'public' })
export class DishonestSs {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'ss_id' })
  ssId: string;

  @Column('bigint', { name: 'evaluation_id', nullable: true })
  evaluationId: string | null;

  @Column('text', { name: 'ss_s3key', nullable: true })
  ssS3key: string | null;

  @Column('integer', { name: 'id', nullable: true })
  id: number | null;

  @Column('timestamp without time zone', {
    name: 'created_on',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdOn: Date | null;

  @ManyToOne(() => Evaluation, (evaluation) => evaluation.dishonestSs)
  @JoinColumn([{ name: 'evaluation_id', referencedColumnName: 'evaluationId' }])
  evaluation: Evaluation;
}


