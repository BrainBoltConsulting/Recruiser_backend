import { AbstractDto } from "../dtos/abstract.dto";

export interface IAbstract <DTO extends AbstractDto> {
    id: string;
    createdAt: Date;
    updatedAt: Date;

    toDto(opt?: any): DTO;
}