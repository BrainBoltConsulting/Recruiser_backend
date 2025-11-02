import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AbstractEntity } from '../modules/common/entities/abstract.entity';
import { QuestionDto } from '../modules/common/modules/question/question.dto';
import { Answers } from './Answers';
import { Dishonest } from './Dishonest';
import { Evaluation } from './Evaluation';
import { Skills } from './Skills';

@Index('questions_pkey', ['questionId'], { unique: true })
@Entity('questions', { schema: 'public' })
export class Questions extends AbstractEntity<QuestionDto> {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'question_id' })
  questionId: string;

  @Column('integer', { name: 'primary_skill_id', nullable: true })
  primarySkillId: number | null;

  @Column('text', { name: 'sub_tech', nullable: true })
  subTech: string | null;

  @Column('smallint', { name: 'difficulty_level', nullable: true })
  difficultyLevel: number | null;

  @Column('smallint', { name: 'question_level', nullable: true })
  questionLevel: number | null;

  @Column('integer', { name: 'time_to_answer', nullable: true })
  timeToAnswer: number | null;

  @Column('text', { name: 'question_text', nullable: true })
  questionText: string | null;

  @Column('text', { name: 'code_file_name', nullable: true })
  codeFileName: string | null;

  @Column('timestamp without time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('timestamp without time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('text', { name: 'question_image_s3_link', nullable: true })
  questionImageS3Link: string | null;

  @Column('text', { name: 'question_video_s3_link', nullable: true })
  questionVideoS3Link: string | null;

  @OneToMany(() => Answers, (answers) => answers.question)
  answers: Answers[];

  @OneToMany(() => Dishonest, (dishonest) => dishonest.question)
  dishonests: Dishonest[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.question)
  evaluations: Evaluation[];

  @ManyToOne(() => Skills)
  @JoinColumn([{ name: 'primary_skill_id', referencedColumnName: 'skillId' }])
  primarySkill: Skills;

  dtoClass = QuestionDto;
}
