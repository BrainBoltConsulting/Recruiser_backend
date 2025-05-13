import { LoggerTypeEnum, loggerTypeEnumMapper, LoggerSourceEnum } from './../../constants/logger-type.enum';
import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { ApiConfigService } from '../../shared/services/api-config.service';
const WinstonCloudWatch = require('winston-cloudwatch');

type MetaType = {
  source: LoggerSourceEnum
}

type InterviewLogDetailsType = {
  interviewId: number;
  scheduleId: string;
  candidateId: number;
}

@Injectable()
export class CloudWatchLoggerService {
  constructor(
    private readonly configService: ApiConfigService
  ) {}

  private createLogger(scheduleId: string, candidateId: number, interviewId: number): winston.Logger {
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

  log(level: LoggerTypeEnum, message: string, meta: MetaType, logDetails: InterviewLogDetailsType) {
    const logger = this.createLogger(logDetails.scheduleId, logDetails.candidateId, logDetails.interviewId);

    logger.log(loggerTypeEnumMapper[level], message, meta);
  }

  logFromBackend(message: string, logDetails: InterviewLogDetailsType, level: LoggerTypeEnum = LoggerTypeEnum.INFO) {
    return this.log(level, message, { source: LoggerSourceEnum.BACKEND }, logDetails )
  }

  logFromFrontend(message: string, logDetails: InterviewLogDetailsType, level: LoggerTypeEnum = LoggerTypeEnum.INFO) {
    return this.log(level, message, { source: LoggerSourceEnum.FRONTEND }, logDetails )
  }

  logAboutInterviewPause(message: string, logDetails: InterviewLogDetailsType, source: LoggerSourceEnum) {
    return this.log(LoggerTypeEnum.ERROR, message, { source }, logDetails )
  }
}