import { forwardRef, Module } from '@nestjs/common';

import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { CognitoAuthGuard } from '../../guards/cognito-auth.guard';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { ConfigRepository } from '../../repositories/ConfigRepository';
import { DishonestRepository } from '../../repositories/DishonestRepository';
import { EvaluationRepository } from '../../repositories/EvaluationRepository';
import { InterviewRepository } from '../../repositories/InterviewRepository';
import { JobShortlistedProfilesRepository } from '../../repositories/JobShortlistedProfilesRepository';
import { JobsRepository } from '../../repositories/JobsRepository';
import { ManagerRelationshipRepository } from '../../repositories/ManagerRelationshipRepository';
import { ManagerRepository } from '../../repositories/ManagerRepository';
import { ScheduleRepository } from '../../repositories/ScheduleRepository';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { CandidateModule } from '../candidate/candidate.module';
import { QuestionModule } from '../question/question.module';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      CandidateRepository,
      ScheduleRepository,
      EvaluationRepository,
      ConfigRepository,
      InterviewRepository,
      DishonestRepository,
      JobsRepository,
      JobShortlistedProfilesRepository,
      ManagerRelationshipRepository,
      ManagerRepository,
    ]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
    forwardRef(() => CandidateModule),
    forwardRef(() => QuestionModule),
  ],
  providers: [MeetingService, JwtStrategy, CognitoAuthGuard],
  controllers: [MeetingController],
  exports: [MeetingService, JwtStrategy],
})
export class MeetingModule {}
