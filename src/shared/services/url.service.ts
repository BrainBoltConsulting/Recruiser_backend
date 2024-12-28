import { UrlEntity } from './../../modules/shared/url.entity';
import {Injectable} from "@nestjs/common";
import {UrlRepository} from "../repositories/url.repository";
import {Transactional} from "typeorm-transactional";
import {S3Service} from "./aws-s3.service";
import { AbstractEntity } from "../../modules/common/entities/abstract.entity";
import { UrlDto } from "../../modules/common/modules/shared/url.dto";

@Injectable()
export class UrlService {
    constructor(
        private readonly urlRepository: UrlRepository,
        public readonly s3Service: S3Service,
    ) {}

    @Transactional()
    async create(data: { file: Express.Multer.File, targetType: any, urlType: any, targetId?: string, target: AbstractEntity<any>}): Promise<UrlDto> {
        const s3Data = await this.s3Service.uploadFile(data.file , data.targetType);
        const link = s3Data.Location;
        return (await this.urlRepository.save(this.urlRepository.create({ ...data, link, [`${data.targetType.toLowerCase()}Id`]: data.targetId, [`${data.targetType.toLowerCase()}`]: data.target }))).toDto();
    }

    async getFileByUserId(userId: string, options: { urlType: any }) {
        return this.urlRepository.findSpecialFileByUserId(userId, options.urlType)
    }

    async getFileByCompanyId(companyId: string, options: { urlType: any}) {
        return this.urlRepository.findSpecialFileByCompanyId(companyId, options.urlType)
    }

    async getFileByTargetId(targetId: string, targetType: any, urlType: any) {
    
    }

    async updateFile(options: { entity: UrlEntity, newFile: Express.Multer.File, targetType: any }) {
        const s3Data = await this.s3Service.uploadFile(options.newFile, options.targetType);
        const link = s3Data.Location;
        await this.urlRepository.save({
            ...options.entity,
            link
        });
        await this.deleteUrlItem(options.entity.link)
        // return (await this.urlRepository.findById(options.entity.id)).toDto();
    }

    @Transactional()
    async deleteUrlItem(link: string, id?: string) {
        const parts = link.split('://')[1].split('/');
        const objectKey = parts.slice(1).join('/');

        if (id) {
            // await this.urlRepository.delete({ id });
        }
        await this.s3Service.deleteObject(objectKey);
    }

    @Transactional()
    async deleteUrlEntities(urlEntities: UrlEntity[]): Promise<void> {
        await this.urlRepository.remove(urlEntities);
    }
}
