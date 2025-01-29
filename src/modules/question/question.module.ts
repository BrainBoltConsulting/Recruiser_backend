import { SkillModule } from './../skill/skill.module';
import { CandidateModule } from './../candidate/candidate.module';
import { AnswersRepository } from './../../repositories/AnswersRepository';
import { QuestionsRepository } from './../../repositories/QuestionsRepository';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([QuestionsRepository, AnswersRepository]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
    forwardRef(() => CandidateModule),
    forwardRef(() => SkillModule)

  ],
  providers: [QuestionService, JwtStrategy],
  controllers: [QuestionController],
  exports: [QuestionService, JwtStrategy],
})
export class QuestionModule {}
