import { UsersRepository } from './../../repositories/UsersRepository';
import { forwardRef, Module } from '@nestjs/common';

import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserTokenRepository } from './user-token.repository';
import { UserTokenService } from './user-token.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      UserTokenRepository, 
      UsersRepository]),
    forwardRef(() => UserModule)
    
  ],
  providers: [AuthService, 
    UserTokenService, 
    JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
