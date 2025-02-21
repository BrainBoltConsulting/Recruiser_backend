import { S3Controller } from './s3.controller';
import { S3Service } from './../../shared/services/aws-s3.service';
import { Module, forwardRef } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    forwardRef(() => SharedModule),
  ],
  providers: [],
  controllers: [S3Controller],
  exports: [],
})
export class S3Module {}

