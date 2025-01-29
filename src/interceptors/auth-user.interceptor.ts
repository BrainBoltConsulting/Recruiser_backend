import { Candidate } from './../entities/Candidate';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ContextProvider } from "../providers/context.provider";
import { StatusEnum } from '../constants/status.enum';
import { UserIsNotActiveException } from '../modules/auth/exceptions/user-is-not-active.exception';
import { DataSource } from "typeorm";
import { Reflector } from "@nestjs/core";


interface AuthUserInterceptorOptions {
    setUserSession?: boolean;
}

@Injectable()
export class AuthUserInterceptor implements NestInterceptor {
    constructor(
        private readonly dataSource: DataSource,
        private reflector: Reflector
    ) {}

    async intercept(context: ExecutionContext, next: CallHandler<any>){
        const request = context.switchToHttp().getRequest();

        if (request.user.status === StatusEnum.INACTIVE) {
            throw new UserIsNotActiveException()
        }

        ContextProvider.setAuthUser(<Candidate>request.user);
        
        const userSession = this.reflector.get<string[]>(
            'userSession', 
            context.getHandler(),
        );

        if (userSession) {
            await this.dataSource.query(`SET app.current_user_id TO '${request.user.id}'`);
        }

        
        return next.handle();
    }
}