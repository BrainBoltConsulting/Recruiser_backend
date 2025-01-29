import { CandidateModule } from './../candidate/candidate.module';
import { SkillController } from './skill.controller';
import { AnswersRepository } from '../../repositories/AnswersRepository';
import { QuestionsRepository } from '../../repositories/QuestionsRepository';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { SkillService } from './skill.service';
import { SkillsRepository } from '../../repositories/SkillsRepository';
import { CandidateSkillsRepository } from '../../repositories/CandidateSkillsRepository';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([QuestionsRepository, AnswersRepository, SkillsRepository, CandidateSkillsRepository]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
    forwardRef(() => CandidateModule)
  ],
  providers: [SkillService, JwtStrategy],
  controllers: [SkillController],
  exports: [SkillService, JwtStrategy],
})
export class SkillModule {}
