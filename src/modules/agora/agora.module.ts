import { AgoraController } from './agora.controller';
import { Module } from '@nestjs/common';
import { AgoraService } from './agora.service';


@Module({
  providers: [AgoraService],
  controllers: [AgoraController],
  exports: [AgoraService]
})
export class AgoraModule {}
