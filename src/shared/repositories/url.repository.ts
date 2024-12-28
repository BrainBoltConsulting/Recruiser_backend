import { Repository } from 'typeorm';

import { CustomRepository } from '../../db/typeorm-ex.decorator';
import { UrlEntity } from '../../modules/shared/url.entity';

@CustomRepository(UrlEntity)
export class UrlRepository extends Repository<UrlEntity> {
    findById(id: string): Promise<UrlEntity | null> {
        return this.createQueryBuilder('urls')
            .where('urls.id = :id', { id })
            .getOne()
    }

    findSpecialFileByUserId(userId: string, urlType: any): Promise<UrlEntity | null> {
        return this.createQueryBuilder('urls')
            .where('urls.userId = :userId', { userId })
            .andWhere('urls.urlType = :urlType', { urlType })
            .getOne()
    }

    findSpecialFileByCompanyId(companyId: string, urlType: any): Promise<UrlEntity | null> {
        return this.createQueryBuilder('urls')
            .where('urls.companyId = :companyId', { companyId })
            .andWhere('urls.urlType = :urlType', { urlType })
            .getOne()
    }
}
