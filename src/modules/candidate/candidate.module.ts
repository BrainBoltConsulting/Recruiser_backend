import { ScheduleRepository } from './../../repositories/ScheduleRepository';
import { EvaluationRepository } from './../../repositories/EvaluationRepository';
import { DishonestRepository } from './../../repositories/DishonestRepository';
import { InterviewRepository } from './../../repositories/InterviewRepository';
import { MeetingModule } from './../meeting/meeting.module';
import { LoginRepository } from './../../repositories/LoginRepository';
import { SkillModule } from './../skill/skill.module';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { UserTokenService } from '../auth/user-token.service';
import { UserTokenRepository } from '../auth/user-token.repository';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([CandidateRepository,
      UserTokenRepository, LoginRepository, InterviewRepository, DishonestRepository, EvaluationRepository, ScheduleRepository
    ]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
    forwardRef(() => SkillModule),
    forwardRef(() => MeetingModule)
  ],
  providers: [CandidateService, JwtStrategy, 
   UserTokenService
  ],
  controllers: [CandidateController],
  exports: [CandidateService, JwtStrategy],
})
export class CandidateModule {}
