import { QuestionsRepository } from './../../repositories/QuestionsRepository';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmExModule } from '../../db/typeorm-ex.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { QuestionService } from './question.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([QuestionsRepository]),
    forwardRef(() => SharedModule),
    forwardRef(() => AuthModule),
  ],
  providers: [QuestionService, JwtStrategy],
  controllers: [],
  exports: [QuestionService, JwtStrategy],
})
export class QuestionModule {}
