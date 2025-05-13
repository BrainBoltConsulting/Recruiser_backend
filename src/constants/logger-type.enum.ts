export enum LoggerTypeEnum {
    ERROR = 'ERROR',
    INFO = 'INFO'
}

export enum LoggerSourceEnum {
    BACKEND = 'BACKEND',
    FRONTEND = 'FRONTEND'
}

export const loggerTypeEnumMapper = {
    [LoggerTypeEnum.ERROR]: "error",
    [LoggerTypeEnum.INFO]: "info",
}  