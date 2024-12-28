import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../common/entities/abstract.entity';
import { UrlDto } from '../common/modules/shared/url.dto';

@Entity({ name: 'Urls' })
export class UrlEntity extends AbstractEntity<UrlDto> {
  @Column()
  link: string;

  @Column({ nullable: true })
  cloudFrontLink: string

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  companyId: string;

  dtoClass = UrlDto;
}
