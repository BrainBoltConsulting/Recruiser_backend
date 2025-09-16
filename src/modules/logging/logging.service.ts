import { Injectable, Logger } from '@nestjs/common';
import { FrontendLogEventDto } from './dtos';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  async processFrontendLogs(events: FrontendLogEventDto[]): Promise<void> {
    for (const event of events) {
      try {
        // Format the log message for better visibility in Amplify logs
        const logMessage = this.formatLogMessage(event);
        
        // Log to NestJS logger (which Amplify will capture)
        switch (event.level.toLowerCase()) {
          case 'error':
            this.logger.error(logMessage);
            break;
          case 'warn':
            this.logger.warn(logMessage);
            break;
          case 'debug':
            this.logger.debug(logMessage);
            break;
          default:
            this.logger.log(logMessage);
        }
      } catch (error) {
        this.logger.error(`Failed to process frontend log event: ${error.message}`, error.stack);
      }
    }
  }

  private formatLogMessage(event: FrontendLogEventDto): string {
    // Create a structured log message that's easy to read in Amplify
    const logData = {
      source: 'FRONTEND',
      level: event.level,
      message: event.message,
      timestamp: event.timestamp,
      sessionId: event.sessionId,
      url: event.url,
      userAgent: this.truncateUserAgent(event.userAgent),
      metadata: event.metadata
    };

    // Return formatted JSON string for structured logging
    return `FRONTEND_LOG: ${JSON.stringify(logData)}`;
  }

  private truncateUserAgent(userAgent: string): string {
    // Truncate user agent for cleaner logs
    if (!userAgent) return 'unknown';
    
    const maxLength = 100;
    return userAgent.length > maxLength 
      ? `${userAgent.substring(0, maxLength)}...` 
      : userAgent;
  }
}
