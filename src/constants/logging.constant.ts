// Frontend logging interfaces and types

export interface LogContext {
  userId?: string;
  scheduleId?: number;
  questionId?: string;
  candidateId?: string;
  sessionId?: string;
  browser?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: number;
  level: string;
  category: string;
  eventType?: string;
  message: string;
  context?: LogContext;
  component?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface TimerEntry {
  startTime: number;
  category: string;
  description?: string;
}

// Log Categories
export enum LogCategory {
  MEETING = 'MEETING',
  INTERVIEW = 'INTERVIEW', 
  AUTH = 'AUTH',
  AGORA = 'AGORA',
  RECORDING = 'RECORDING',
  CHEAT_DETECTION = 'CHEAT_DETECTION',
  UI = 'UI',
  API = 'API',
  ERROR = 'ERROR',
  PERFORMANCE = 'PERFORMANCE',
  USER_ACTION = 'USER_ACTION'
}

// Log Levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// Log Event Types
export enum LogEventType {
  MEETING_INIT = 'MEETING_INIT',
  MEETING_START = 'MEETING_START',
  MEETING_END = 'MEETING_END',
  AGORA_CONNECT = 'AGORA_CONNECT',
  AGORA_DISCONNECT = 'AGORA_DISCONNECT',
  RECORDING_START = 'RECORDING_START',
  RECORDING_STOP = 'RECORDING_STOP',
  QUESTION_START = 'QUESTION_START',
  QUESTION_END = 'QUESTION_END',
  CHEAT_DETECTED = 'CHEAT_DETECTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  API_CALL = 'API_CALL',
  API_ERROR = 'API_ERROR',
  STATE_CHANGE = 'STATE_CHANGE',
  USER_INTERACTION = 'USER_INTERACTION',
  ERROR_BOUNDARY = 'ERROR_BOUNDARY'
}

// Security filters - sensitive data to exclude from logs
export const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'authorization',
  'cookie',
  'session',
  'secret',
  'key',
  'private',
  'credential',
  'email',
  'phone',
  'phoneNo'
];
