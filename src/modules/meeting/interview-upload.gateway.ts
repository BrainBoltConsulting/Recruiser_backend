import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MeetingService } from './meeting.service';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class InterviewUploadGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly meetingService: MeetingService) {}

  @SubscribeMessage('uploadChunk')
  async handleUploadChunk(
    @MessageBody() data: { 
      scheduleId: string; 
      uploadId: string; 
      partNumber: number; 
      s3Key: string; 
      chunk: Buffer 
    },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const result = await this.meetingService.uploadMultipartChunk(
        data.scheduleId,
        data.s3Key,
        { buffer: data.chunk } as Express.Multer.File,
        data.uploadId,
        data.partNumber
      );

      client.emit('chunkUploaded', {
        success: true,
        ETag: result.ETag,
        PartNumber: result.PartNumber
      });
    } catch (error) {
      client.emit('chunkUploadError', {
        success: false,
        error: error.message,
        partNumber: data.partNumber
      });
    }
  }

  @SubscribeMessage('completeUpload')
  async handleCompleteUpload(
    @MessageBody() data: { 
      scheduleId: string; 
      uploadId: string; 
      s3Key: string; 
      parts: { ETag: string; PartNumber: number }[] 
    },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const result = await this.meetingService.completeMultipartUpload(
        data.scheduleId,
        data.s3Key,
        data.uploadId,
        data.parts
      );

      client.emit('uploadCompleted', {
        success: true,
        s3Key: result.s3Key
      });
    } catch (error) {
      client.emit('uploadCompleteError', {
        success: false,
        error: error.message
      });
    }
  }
}
