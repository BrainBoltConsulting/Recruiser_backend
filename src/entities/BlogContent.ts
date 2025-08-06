import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BlogHeader } from './BlogHeader';

@Index('blog_content_pkey', ['blogContentId'], { unique: true })
@Index('blog_content_blog_text_key', ['blogText'], { unique: true })
@Entity('blog_content', { schema: 'public' })
export class BlogContent {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'blog_content_id' })
  blogContentId: string;

  @Column('bigint', { name: 'text_seq' })
  textSeq: string;

  @Column('text', { name: 'blog_text', unique: true })
  blogText: string;

  @Column('boolean', { name: 'is_deleted', default: () => 'false' })
  isDeleted: boolean;

  @Column('timestamp without time zone', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column('timestamp without time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @ManyToOne(() => BlogHeader, (blogHeader) => blogHeader.blogContents)
  @JoinColumn([{ name: 'blog_id', referencedColumnName: 'blogId' }])
  blog: BlogHeader;
}
