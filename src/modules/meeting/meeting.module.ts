import { JobsRepository } from './../../repositories/JobsRepository';
import { DishonestRepository } from './../../repositories/DishonestRepository';
import { InterviewRepository } from './../../repositories/InterviewRepository';
import { ConfigRepository } from './../../repositories/ConfigRepository';
import { EvaluationRepository } from './../../repositories/EvaluationRepository';
import { QuestionModule } from './../question/question.module';
import { ScheduleRepository } from './../../repositories/ScheduleRepository';
import { CandidateModule } from './../candidate/candidate.module';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { CandidateRepository } from '../../repositories/CandidateRepository';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([CandidateRepository, ScheduleRepository, EvaluationRepository, ConfigRepository, InterviewRepository, DishonestRepository, JobsRepository]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
    forwardRef(() => CandidateModule),
    forwardRef(() => QuestionModule)
  ],
  providers: [MeetingService, JwtStrategy],
  controllers: [MeetingController],
  exports: [MeetingService, JwtStrategy],
})
export class MeetingModule {}
