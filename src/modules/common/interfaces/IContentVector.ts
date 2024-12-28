import { TciShapeTypeEnum } from "../../../constants/tci-shape-type.enum";
import { ProductSerieTypeEnum } from "../../../constants/product-serie-type.enum";

export interface IProductContentVector {
    name: string;
    size: number;
    categoryName: string;
    subcategoryName: string;
    serieType?: ProductSerieTypeEnum;
    tciShape?: TciShapeTypeEnum;
}

export interface IUserContentVector {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    companyName: string;
}

export interface ICompanyContentVector {
    email: string;
    name: string;
    phoneNumber: string;
}