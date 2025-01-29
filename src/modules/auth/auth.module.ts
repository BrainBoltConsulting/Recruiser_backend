import { CandidateRepository } from './../../repositories/CandidateRepository';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { CandidateModule } from '../candidate/candidate.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserTokenService } from './user-token.service';
import { UserTokenRepository } from './user-token.repository';
import { LoginRepository } from '../../repositories/LoginRepository';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      CandidateRepository, UserTokenRepository, LoginRepository]),
    forwardRef(() => CandidateModule)
    
  ],
  providers: [AuthService, 
    UserTokenService, 
    JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
