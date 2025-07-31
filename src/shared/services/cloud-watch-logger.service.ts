import { Injectable } from '@nestjs/common';
import winston from 'winston';
import winstonCloudWatch from 'winston-cloudwatch';

import {
  LoggerSourceEnum,
  LoggerTypeEnum,
  loggerTypeEnumMapper,
} from '../../constants/logger-type.enum';
import { ApiConfigService } from './api-config.service';

interface IMetaType {
  source: LoggerSourceEnum;
}

interface IInterviewLogDetailsType {
  interviewId: number;
  scheduleId: string;
  candidateId: number;
}

@Injectable()
export class CloudWatchLoggerService {
  constructor(private readonly configService: ApiConfigService) {}

  private createLogger(
    scheduleId: string,
    candidateId: number,
    interviewId: number,
  ): winston.Logger {
    const logStreamName = `${
      new Date().toISOString().split('T')[0]
    }-SId-${scheduleId}-CId-${candidateId}-IId-${interviewId}`;

    return winston.createLogger({
      transports: [
        new winstonCloudWatch({
          logGroupName:
            this.configService.awsConfig.cloudWatchInterviewGroupName,
          logStreamName,
          awsRegion: this.configService.awsConfig.region,
          jsonMessage: true,
        }),
      ],
    });
  }

  log(
    level: LoggerTypeEnum,
    message: string,
    meta: IMetaType,
    logDetails: IInterviewLogDetailsType,
  ) {
    const logger = this.createLogger(
      logDetails.scheduleId,
      logDetails.candidateId,
      logDetails.interviewId,
    );

    logger.log(loggerTypeEnumMapper[level], message, meta);
  }

  logFromBackend(
    message: string,
    logDetails: IInterviewLogDetailsType,
    level: LoggerTypeEnum = LoggerTypeEnum.INFO,
  ) {
    return this.log(
      level,
      message,
      { source: LoggerSourceEnum.BACKEND },
      logDetails,
    );
  }

  logFromFrontend(
    message: string,
    logDetails: IInterviewLogDetailsType,
    level: LoggerTypeEnum = LoggerTypeEnum.INFO,
  ) {
    return this.log(
      level,
      message,
      { source: LoggerSourceEnum.FRONTEND },
      logDetails,
    );
  }

  logAboutInterviewPause(
    message: string,
    logDetails: IInterviewLogDetailsType,
    source: LoggerSourceEnum,
  ) {
    return this.log(LoggerTypeEnum.ERROR, message, { source }, logDetails);
  }
}
