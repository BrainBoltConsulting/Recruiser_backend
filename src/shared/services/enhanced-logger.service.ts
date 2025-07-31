import { Injectable } from '@nestjs/common';
import { performance } from 'perf_hooks';
import { LogLevel, LogCategory } from '../../constants/logger-type.enum';

interface LogContext {
  userId?: string;
  scheduleId?: string;
  interviewId?: string;
  candidateId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class EnhancedLoggerService {
  private performanceMarks: Map<string, number> = new Map();

  // ANSI Color codes
  private colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
  };

  // Emoji mappings for different log types
  private emojis = {
    [LogLevel.ERROR]: '❌',
    [LogLevel.WARN]: '⚠️',
    [LogLevel.INFO]: 'ℹ️',
    [LogLevel.DEBUG]: '🔍',
    [LogLevel.SUCCESS]: '✅',
  };

  private categoryEmojis = {
    [LogCategory.DATABASE]: '🗄️',
    [LogCategory.API]: '🌐',
    [LogCategory.AUTH]: '🔐',
    [LogCategory.UPLOAD]: '📤',
    [LogCategory.NOTIFICATION]: '📢',
    [LogCategory.INTERVIEW]: '🎥',
    [LogCategory.SYSTEM]: '⚙️',
  };

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return this.colors.red;
      case LogLevel.WARN:
        return this.colors.yellow;
      case LogLevel.INFO:
        return this.colors.cyan;
      case LogLevel.DEBUG:
        return this.colors.magenta;
      case LogLevel.SUCCESS:
        return this.colors.green;
      default:
        return this.colors.white;
    }
  }

  private getCategoryColor(category: LogCategory): string {
    switch (category) {
      case LogCategory.DATABASE:
        return this.colors.blue;
      case LogCategory.API:
        return this.colors.green;
      case LogCategory.AUTH:
        return this.colors.yellow;
      case LogCategory.UPLOAD:
        return this.colors.magenta;
      case LogCategory.NOTIFICATION:
        return this.colors.cyan;
      case LogCategory.INTERVIEW:
        return this.colors.red;
      case LogCategory.SYSTEM:
        return this.colors.white;
      default:
        return this.colors.white;
    }
  }

  private formatTimestamp(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    
    return `${this.colors.dim}${date} ${this.colors.bold}${time}.${ms}${this.colors.reset}`;
  }

  private formatContext(context?: LogContext): string {
    if (!context) return '';
    
    const parts: string[] = [];
    
    if (context.userId) {
      parts.push(`👤 ${this.colors.blue}User:${context.userId}${this.colors.reset}`);
    }
    
    if (context.scheduleId) {
      parts.push(`📅 ${this.colors.green}Schedule:${context.scheduleId}${this.colors.reset}`);
    }
    
    if (context.interviewId) {
      parts.push(`🎥 ${this.colors.magenta}Interview:${context.interviewId}${this.colors.reset}`);
    }
    
    if (context.candidateId) {
      parts.push(`👤 ${this.colors.cyan}Candidate:${context.candidateId}${this.colors.reset}`);
    }
    
    if (context.duration !== undefined) {
      const durationColor = context.duration > 1000 ? this.colors.red : 
                           context.duration > 500 ? this.colors.yellow : this.colors.green;
      parts.push(`⏱️ ${durationColor}${context.duration.toFixed(2)}ms${this.colors.reset}`);
    }
    
    return parts.length > 0 ? `[${parts.join(' | ')}]` : '';
  }

  private formatMetadata(metadata?: Record<string, any>): string {
    if (!metadata || Object.keys(metadata).length === 0) return '';
    
    return `\n${this.colors.dim}📋 Metadata: ${JSON.stringify(metadata, null, 2)}${this.colors.reset}`;
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    className?: string,
  ): void {
    const timestamp = this.formatTimestamp();
    const levelColor = this.getLevelColor(level);
    const categoryColor = this.getCategoryColor(category);
    const levelEmoji = this.emojis[level];
    const categoryEmoji = this.categoryEmojis[category];
    const contextStr = this.formatContext(context);
    const metadataStr = this.formatMetadata(context?.metadata);
    const classInfo = className ? `${this.colors.bold}[${className}]${this.colors.reset}` : '';
    
    const logLine = [
      timestamp,
      `${levelEmoji} ${levelColor}${this.colors.bold}${level}${this.colors.reset}`,
      `${categoryEmoji} ${categoryColor}${category}${this.colors.reset}`,
      classInfo,
      contextStr,
      `${this.colors.bold}${message}${this.colors.reset}`,
      metadataStr,
    ].filter(Boolean).join(' ');
    
    console.log(logLine);
  }

  // Public methods for different log levels
  error(category: LogCategory, message: string, context?: LogContext, className?: string): void {
    this.log(LogLevel.ERROR, category, message, context, className);
  }

  warn(category: LogCategory, message: string, context?: LogContext, className?: string): void {
    this.log(LogLevel.WARN, category, message, context, className);
  }

  info(category: LogCategory, message: string, context?: LogContext, className?: string): void {
    this.log(LogLevel.INFO, category, message, context, className);
  }

  debug(category: LogCategory, message: string, context?: LogContext, className?: string): void {
    this.log(LogLevel.DEBUG, category, message, context, className);
  }

  success(category: LogCategory, message: string, context?: LogContext, className?: string): void {
    this.log(LogLevel.SUCCESS, category, message, context, className);
  }

  // Performance monitoring methods
  startTimer(label: string): void {
    this.performanceMarks.set(label, performance.now());
    this.debug(LogCategory.SYSTEM, `⏱️ Timer started: ${label}`, {}, 'PerformanceMonitor');
  }

  endTimer(label: string, category: LogCategory = LogCategory.SYSTEM, message?: string, context?: LogContext): number {
    const startTime = this.performanceMarks.get(label);
    if (!startTime) {
      this.warn(LogCategory.SYSTEM, `Timer '${label}' not found`, {}, 'PerformanceMonitor');
      return 0;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(label);

    const logMessage = message || `Timer completed: ${label}`;
    const logContext = { ...context, duration };

    if (duration > 2000) {
      this.warn(category, `🐌 SLOW: ${logMessage}`, logContext, 'PerformanceMonitor');
    } else if (duration > 1000) {
      this.info(category, `⏳ ${logMessage}`, logContext, 'PerformanceMonitor');
    } else {
      this.success(category, `⚡ FAST: ${logMessage}`, logContext, 'PerformanceMonitor');
    }

    return duration;
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(LogCategory.API, `📨 ${method} ${url}`, context, 'APIMonitor');
  }

  apiResponse(method: string, url: string, statusCode: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : 
                 statusCode >= 300 ? LogLevel.WARN : LogLevel.SUCCESS;
    this.log(level, LogCategory.API, `📨 ${method} ${url} → ${statusCode}`, context, 'APIMonitor');
  }

  databaseQuery(query: string, context?: LogContext): void {
    this.debug(LogCategory.DATABASE, `🔍 Query: ${query.substring(0, 100)}...`, context, 'DatabaseMonitor');
  }

  databaseResult(affectedRows: number, context?: LogContext): void {
    this.success(LogCategory.DATABASE, `📊 Affected rows: ${affectedRows}`, context, 'DatabaseMonitor');
  }

  interviewEvent(event: string, context?: LogContext): void {
    this.info(LogCategory.INTERVIEW, `🎬 ${event}`, context, 'InterviewMonitor');
  }

  authEvent(event: string, context?: LogContext): void {
    this.info(LogCategory.AUTH, `🔐 ${event}`, context, 'AuthMonitor');
  }

  uploadEvent(event: string, context?: LogContext): void {
    this.info(LogCategory.UPLOAD, `📤 ${event}`, context, 'UploadMonitor');
  }

  notificationEvent(event: string, context?: LogContext): void {
    this.info(LogCategory.NOTIFICATION, `📢 ${event}`, context, 'NotificationMonitor');
  }

  // System health monitoring
  systemHealth(metrics: Record<string, any>): void {
    this.info(LogCategory.SYSTEM, '🏥 System Health Check', { metadata: metrics }, 'HealthMonitor');
  }

  // Header separator for better log organization
  logSeparator(title: string): void {
    const separator = '═'.repeat(80);
    const titleLine = `  ${title}  `;
    const padding = Math.max(0, (separator.length - titleLine.length) / 2);
    const paddedTitle = '═'.repeat(Math.floor(padding)) + titleLine + '═'.repeat(Math.ceil(padding));
    
    console.log(`\n${this.colors.bold}${this.colors.cyan}${separator}${this.colors.reset}`);
    console.log(`${this.colors.bold}${this.colors.cyan}${paddedTitle}${this.colors.reset}`);
    console.log(`${this.colors.bold}${this.colors.cyan}${separator}${this.colors.reset}\n`);
  }
} 