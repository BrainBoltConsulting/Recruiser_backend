import { UsersRepository } from './../../repositories/UsersRepository';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { UserTokenService } from '../auth/user-token.service';
import { UserTokenRepository } from '../auth/user-token.repository';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UsersRepository,
      UserTokenRepository
    ]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule)
  ],
  providers: [UserService, JwtStrategy, 
   UserTokenService
  ],
  controllers: [UserController],
  exports: [UserService, JwtStrategy],
})
export class UserModule {}
