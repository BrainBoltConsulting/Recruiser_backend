import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { ApiConfigService } from '../../shared/services/api-config.service';
const WinstonCloudWatch = require('winston-cloudwatch');

@Injectable()
export class CloudWatchLoggerService {
  constructor(
    private readonly configService: ApiConfigService
  ) {}

  private createLogger(scheduleId: string, candidateId: string, interviewId: string): winston.Logger {
    const logStreamName = `${new Date().toISOString().split('T')[0]}-SId-${scheduleId}-CId-${candidateId}-IId-${interviewId}`;

    return winston.createLogger({
      transports: [
        new WinstonCloudWatch({
          logGroupName: this.configService.awsConfig.cloudWatchInterviewGroupName,
          logStreamName,
          awsRegion: this.configService.awsConfig.region,
          jsonMessage: true,
        }),
      ],
    });
  }

  log(level: string, message: string, meta: Record<string, any>, scheduleId: string, candidateId: string, interviewId: string) {
    const logger = this.createLogger(scheduleId, candidateId, interviewId);
    logger.log(level, message, meta);
  }
}