import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { UtilsProvider } from '../../providers/utils.provider';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class SlackNotificationService {
  private readonly logger = new Logger(SlackNotificationService.name);
  private readonly webhookUrl: string;

  constructor(
    private readonly configService: ApiConfigService
  ) {
    this.webhookUrl = this.configService.slackWebhookUrl || '';
  }

  async send(message: string, options?: { title?: string; color?: string }) {
    if (!this.webhookUrl) {
      this.logger.warn('Slack webhook URL is not defined');
      return;
    }

    const payload = {
      attachments: [
        {
          color: options?.color || '#FF0000',
          title: options?.title || 'Notification',
          text: message,
        },
      ],
    };

    try {
      // Add timeout configuration (30 seconds)
      await axios.post(this.webhookUrl, payload, {
        timeout: 30_000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.logger.log('Slack notification sent.');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        const isNetworkError = !error.response && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT');
        
        this.logger.error(
          `Failed to send Slack notification - ${statusCode ? `Status: ${statusCode}` : ''} ` +
          `${isTimeout ? 'Timeout' : isNetworkError ? 'Network Error' : error.message}`
        );
      } else {
        this.logger.error('Failed to send Slack notification', error);
      }
    }
  }

  async sendBlocks(blockPayload: { blocks: any[] }, retryCount = 0): Promise<boolean> {
    if (!this.webhookUrl) {
      this.logger.warn('Slack webhook URL not set.');
      return false;
    }
  
    // Add timeout configuration (30 seconds, same as Process API)
    const maxRetries = 3;
    const timeout = 30_000; // 30 seconds

    try {
      // Validate blocks array
      if (!blockPayload.blocks || !Array.isArray(blockPayload.blocks)) {
        this.logger.error('Invalid blocks payload: blocks must be an array');
        return false;
      }

      // Check block count (Slack limit is 50 blocks per message)
      if (blockPayload.blocks.length > 50) {
        this.logger.error(`Block count exceeds Slack limit: ${blockPayload.blocks.length}/50 blocks`);
        return false;
      }

      await axios.post(this.webhookUrl, blockPayload, {
        timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (retryCount > 0) {
        this.logger.log(`Slack block message sent successfully after ${retryCount} retry(ies).`);
      } else {
        this.logger.log('Slack block message sent.');
      }
      return true;
    } catch (error) {
      // Enhanced error logging for debugging
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const statusText = error.response?.statusText;
        const responseData = error.response?.data;
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        const isNetworkError = !error.response && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT');
        
        // Retry logic for transient errors (network issues, timeouts, 5xx errors)
        const shouldRetry = retryCount < maxRetries && (
          isTimeout ||
          isNetworkError ||
          (statusCode && statusCode >= 500) || // Server errors
          statusCode === 429 // Rate limit
        );

        if (shouldRetry) {
          const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          this.logger.warn(
            `Slack notification failed (attempt ${retryCount + 1}/${maxRetries + 1}). ` +
            `Retrying in ${retryDelay}ms... ` +
            `Error: ${statusCode ? `${statusCode} ${statusText}` : error.message}`
          );
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Retry the request
          return this.sendBlocks(blockPayload, retryCount + 1);
        }
        
        // Final failure - log detailed error
        this.logger.error(`Failed to send Slack block message after ${retryCount + 1} attempt(s) - Status: ${statusCode || 'N/A'} ${statusText || error.message}`);
        
        // Log Slack's error response (usually contains specific validation errors)
        if (responseData) {
          this.logger.error(`Slack API Error Response: ${JSON.stringify(responseData, null, 2)}`);
        }
        
        // Log the payload that caused the error (for debugging) - only on final failure
        if (retryCount >= maxRetries) {
          this.logger.error(`Payload sent (first 1000 chars): ${JSON.stringify(blockPayload).substring(0, 1000)}`);
          this.logger.error(`Total blocks count: ${blockPayload.blocks?.length || 0}`);
          
          // Check for common issues
          if (statusCode === 400) {
            this.logger.error('Common 400 causes: Invalid block structure, missing required fields, message too long, or invalid field values');
          } else if (statusCode === 429) {
            this.logger.error('Slack rate limit exceeded - consider implementing rate limiting or using Slack API with higher limits');
          }
        }
      } else {
        this.logger.error('Failed to send Slack block message', error);
      }
      
      return false;
    }
  }


  /**
   * Builds one or more Slack block payloads (max 50 blocks each — Slack API limit).
   * Evaluations are emitted as tight [section, context] pairs so chunking never splits a question row.
   */
  formatInterviewSlackMessageChunks(interview: {
    interviewId: string;
    scheduleId: string;
    jobId: string;
    jUuid: string;
    candidate: { fullName: string; cUuid?: string };
    browser: string;
    attendedTime: Date;
    finishedEarly: boolean;
    completionReason?: string;
    evaluations: { questionId: string; videofileS3key: string; videofilename: string }[];
    dishonests: { switchCount: number; questionId: string }[];
  }): any[][] {
    // Helper to safely format values and truncate if needed
    const safeText = (value: any, maxLength: number = 3000): string => {
      if (value === null || value === undefined) return 'N/A';
      const text = String(value);
      return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };

    // Helper to format date safely
    const formatDate = (date: Date | string | null | undefined): string => {
      if (!date) return 'N/A';
      try {
        const d = date instanceof Date ? date : new Date(date);
        return isNaN(d.getTime()) ? String(date) : d.toISOString();
      } catch {
        return String(date);
      }
    };

    const totalSwitches = interview.dishonests?.reduce((sum, d) => sum + Number(d.switchCount), 0) || 0;
    
    // Determine notification style based on completion reason
    const getCompletionStyle = (reason?: string) => {
      switch (reason) {
        case 'TAB_CLOSE':
          return {
            emoji: '🚨',
            title: 'Interview Terminated (Tab Close)',
            color: '#FF4444'
          };
        case 'USER_EXIT':
          return {
            emoji: '⚠️',
            title: 'Interview Completed Early (User Exit)',
            color: '#FF8800'
          };
        case 'SYSTEM_ERROR':
          return {
            emoji: '❌',
            title: 'Interview Error (System Error)',
            color: '#CC0000'
          };
        default:
          return {
            emoji: '🎯',
            title: 'Interview Completed Successfully',
            color: '#00AA00'
          };
      }
    };

    const style = getCompletionStyle(interview.completionReason);

    const preamble: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: safeText(`*${style.emoji} ${style.title}*`),
        },
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: safeText(`📋 Interview Summary: ${interview.candidate?.fullName || 'Unknown'}`, 150),
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: safeText(`*Interview ID:*\n${interview.interviewId || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Schedule ID:*\n${interview.scheduleId || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Candidate cUuid:*\n${interview.candidate?.cUuid || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Job ID:*\n${interview.jobId || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*J UUID:*\n${interview.jUuid || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Browser:*\n${interview.browser || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Attended:*\n${formatDate(interview.attendedTime)}`) },
          { type: 'mrkdwn', text: safeText(`*Finished Early:*\n${interview.finishedEarly ? 'Yes' : 'No'}`) },
          { type: 'mrkdwn', text: safeText(`*Completion Reason:*\n${this.getCompletionReasonDisplay(interview.completionReason)}`) },
          { type: 'mrkdwn', text: safeText(`*Total Switches (Cheating):*\n${totalSwitches}`) },
        ],
      },
    ];

    const evaluationPairs: any[][] = [];
    if (interview.evaluations?.length) {
      preamble.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: safeText(`*🎥 Evaluated Questions & Recordings (${interview.evaluations.length}):*`),
        },
      });

      interview.evaluations.forEach((q, i) => {
        const cameraRecording = q.videofileS3key
          ? UtilsProvider.replaceS3UriWithS3Key(this.configService.bucketName, q.videofileS3key)
          : 'N/A';
        const screenRecording = q.videofilename
          ? UtilsProvider.replaceS3UriWithS3Key(this.configService.bucketName, q.videofilename)
          : 'N/A';

        evaluationPairs.push([
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: safeText(`*Question ${i + 1}* (ID: ${q.questionId || 'N/A'})`),
            },
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: safeText(`📹 *Camera:* \`${cameraRecording}\``) },
              { type: 'mrkdwn', text: safeText(`🖥️ *Screen:* \`${screenRecording}\``) },
            ],
          },
        ]);
      });
    }

    const suffixBlocks: any[] = [];
    if (interview.dishonests?.length) {
      const lines = interview.dishonests.map(
        (d, i) =>
          `• *#${i + 1}* \`${safeText(d.questionId || 'N/A', 80)}\` — *switches:* ${d.switchCount || 0}`,
      );
      const body = safeText(lines.join('\n'), 2800);
      suffixBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: safeText(`*⚠️ Cheating events (${interview.dishonests.length})*\n${body}`),
        },
      });
    }

    return this.packInterviewSlackChunks(preamble, evaluationPairs, suffixBlocks);
  }

  private packInterviewSlackChunks(
    preamble: any[],
    evaluationPairs: any[][],
    suffixBlocks: any[],
    maxBlocks = 50,
  ): any[][] {
    const messages: any[][] = [];
    let current: any[] = [...preamble];

    const continuedEvaluations = (): any => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_Interview recording details (continued…)_',
      },
    });

    const continuedOther = (): any => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_Additional details (continued…)_',
      },
    });

    for (const pair of evaluationPairs) {
      if (current.length + pair.length > maxBlocks) {
        if (current.length > 0) {
          messages.push(current);
        }
        current = [continuedEvaluations(), ...pair];
      } else {
        current.push(...pair);
      }
    }

    for (const block of suffixBlocks) {
      if (current.length + 1 > maxBlocks) {
        messages.push(current);
        current = [continuedOther(), block];
      } else {
        current.push(block);
      }
    }

    if (current.length > 0) {
      messages.push(current);
    }

    return messages;
  }

  private getCompletionReasonDisplay(reason?: string): string {
    switch (reason) {
      case 'TAB_CLOSE':
        return '🚨 Tab Close (User closed browser)';
      case 'USER_EXIT':
        return '⚠️ User Exit (Manual early exit)';
      case 'SYSTEM_ERROR':
        return '❌ System Error (Technical issue)';
      case 'NORMAL':
      default:
        return '✅ Normal Completion';
    }
  }
}
