import type { IUserJwtPayload } from './IUserJwtPayload';

export interface IGenerateJWTOptions {
  payload: IUserJwtPayload;
  expiresIn?: number;
}
