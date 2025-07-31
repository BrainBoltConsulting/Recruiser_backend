export enum LoggerTypeEnum {
    ERROR = 'ERROR',
    INFO = 'INFO'
}

export enum LoggerSourceEnum {
    BACKEND = 'BACKEND',
    FRONTEND = 'FRONTEND'
}

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  SUCCESS = 'SUCCESS',
}

export enum LogCategory {
  DATABASE = 'DATABASE',
  API = 'API',
  AUTH = 'AUTH',
  UPLOAD = 'UPLOAD',
  NOTIFICATION = 'NOTIFICATION',
  INTERVIEW = 'INTERVIEW',
  SYSTEM = 'SYSTEM',
}

export const loggerTypeEnumMapper = {
    [LoggerTypeEnum.ERROR]: "error",
    [LoggerTypeEnum.INFO]: "info",
}  