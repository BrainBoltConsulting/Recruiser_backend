import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BlogContent } from "./BlogContent";

@Index("blog_header_author_title_key", ["authorTitle"], { unique: true })
@Index("blog_header_pkey", ["blogId"], { unique: true })
@Index("blog_header_blog_title_key", ["blogTitle"], { unique: true })
@Entity("blog_header", { schema: "public" })
export class BlogHeader {
  @PrimaryGeneratedColumn({ type: "bigint", name: "blog_id" })
  blogId: string;

  @Column("text", { name: "blog_title", unique: true })
  blogTitle: string;

  @Column("text", { name: "author" })
  author: string;

  @Column("text", { name: "author_title", unique: true })
  authorTitle: string;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted: boolean;

  @Column("timestamp without time zone", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column("timestamp without time zone", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @OneToMany(() => BlogContent, (blogContent) => blogContent.blog)
  blogContents: BlogContent[];
}
