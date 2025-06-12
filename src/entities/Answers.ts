import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Questions } from './Questions';

@Index('answers_pkey', ['answerId'], { unique: true })
@Entity('answers', { schema: 'public' })
export class Answers {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'answer_id' })
  answerId: string;

  @Column('text', { name: 'answer', nullable: true })
  answer: string | null;

  @Column('timestamp without time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('timestamp without time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column({ nullable: true, name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Questions, (questions) => questions.answers)
  @JoinColumn([{ name: 'question_id', referencedColumnName: 'questionId' }])
  question: Questions;
}
