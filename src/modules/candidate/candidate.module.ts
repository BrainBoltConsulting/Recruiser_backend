import { forwardRef, Module } from '@nestjs/common';

import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { DishonestRepository } from '../../repositories/DishonestRepository';
import { EvaluationRepository } from '../../repositories/EvaluationRepository';
import { InterviewRepository } from '../../repositories/InterviewRepository';
import { LoginRepository } from '../../repositories/LoginRepository';
import { ScheduleRepository } from '../../repositories/ScheduleRepository';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { UserTokenRepository } from '../auth/user-token.repository';
import { UserTokenService } from '../auth/user-token.service';
import { MeetingModule } from '../meeting/meeting.module';
import { SkillModule } from '../skill/skill.module';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { EmotionScoreRepository } from '../../repositories/EmotionScoreRepository';
import { CommunicationScoresRepository } from '../../repositories/CommunicationScoresRepository';
import { TechnicalScoresRepository } from '../../repositories/TechnicalScoresRepository';
import { VocabScoreRepository } from '../../repositories/VocabScoreRepository';
import { DishonestSsRepository } from '../../repositories/DishonestSsRepository';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      CandidateRepository,
      UserTokenRepository,
      LoginRepository,
      InterviewRepository,
      DishonestRepository,
      EvaluationRepository,
      ScheduleRepository,
      EmotionScoreRepository,
      CommunicationScoresRepository,
      TechnicalScoresRepository,
      VocabScoreRepository,
      DishonestSsRepository,
    ]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
    forwardRef(() => SkillModule),
    forwardRef(() => MeetingModule),
  ],
  providers: [CandidateService, JwtStrategy, UserTokenService],
  controllers: [CandidateController],
  exports: [CandidateService, JwtStrategy],
})
export class CandidateModule {}
