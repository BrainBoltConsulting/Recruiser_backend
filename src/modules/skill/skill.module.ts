import { CandidateModule } from './../candidate/candidate.module';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { SkillService } from './skill.service';
import { SkillsRepository } from '../../repositories/SkillsRepository';
import { CandidateSkillsRepository } from '../../repositories/CandidateSkillsRepository';
import { CandidateRepository } from '../../repositories/CandidateRepository';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      SkillsRepository,
      CandidateSkillsRepository,
      CandidateRepository,
    ]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
    forwardRef(() => CandidateModule)
  ],
  providers: [SkillService, JwtStrategy],
  controllers: [],
  exports: [SkillService, JwtStrategy],
})
export class SkillModule {}
