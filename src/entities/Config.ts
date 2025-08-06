import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('config_pkey', ['configId'], { unique: true })
@Entity('config', { schema: 'public' })
export class Config {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'config_id' })
  configId: string;

  @Column('text', { name: 'config_name', nullable: true })
  configName: string | null;

  @Column('text', { name: 'config_value', nullable: true })
  configValue: string | null;

  @Column('text', { name: 'config_description', nullable: true })
  configDescription: string | null;

  @Column('timestamp without time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('timestamp without time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;
}
