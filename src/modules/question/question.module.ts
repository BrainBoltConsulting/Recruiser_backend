import { AnswersRepository } from './../../repositories/AnswersRepository';
import { QuestionsRepository } from './../../repositories/QuestionsRepository';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { SkillModule } from '../skill/skill.module';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      QuestionsRepository,
      AnswersRepository,
    ]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
    forwardRef(() => SkillModule),
  ],
  providers: [QuestionService, JwtStrategy],
  controllers: [QuestionController],
  exports: [QuestionService, JwtStrategy],
})
export class QuestionModule {}
