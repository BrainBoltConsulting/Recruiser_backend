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
      await axios.post(this.webhookUrl, payload);
      this.logger.log('Slack notification sent.');
    } catch (error) {
      this.logger.error('Failed to send Slack notification', error);
    }
  }

  async sendBlocks(blockPayload: { blocks: any[] }) {
    if (!this.webhookUrl) {
      this.logger.warn('Slack webhook URL not set.');
      return;
    }
  
    try {
      // Validate blocks array
      if (!blockPayload.blocks || !Array.isArray(blockPayload.blocks)) {
        this.logger.error('Invalid blocks payload: blocks must be an array');
        return;
      }

      // Check block count (Slack limit is 50 blocks per message)
      if (blockPayload.blocks.length > 50) {
        this.logger.error(`Block count exceeds Slack limit: ${blockPayload.blocks.length}/50 blocks`);
        return;
      }

      await axios.post(this.webhookUrl, blockPayload);
      this.logger.log('Slack block message sent.');
    } catch (error) {
      // Enhanced error logging for debugging
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const statusText = error.response?.statusText;
        const responseData = error.response?.data;
        
        this.logger.error(`Failed to send Slack block message - Status: ${statusCode} ${statusText}`);
        
        // Log Slack's error response (usually contains specific validation errors)
        if (responseData) {
          this.logger.error(`Slack API Error Response: ${JSON.stringify(responseData, null, 2)}`);
        }
        
        // Log the payload that caused the error (for debugging)
        this.logger.error(`Payload sent (first 1000 chars): ${JSON.stringify(blockPayload).substring(0, 1000)}`);
        this.logger.error(`Total blocks count: ${blockPayload.blocks?.length || 0}`);
        
        // Check for common issues
        if (statusCode === 400) {
          this.logger.error('Common 400 causes: Invalid block structure, missing required fields, message too long, or invalid field values');
        }
      } else {
        this.logger.error('Failed to send Slack block message', error);
      }
    }
  }


  formatInterviewSlackPayload(interview: {
    interviewId: string;
    scheduleId: string;
    jobId: string;
    candidate: { id: string; fullName: string };
    browser: string;
    attendedTime: Date;
    finishedEarly: boolean;
    completionReason?: string;
    evaluations: { questionId: string; videofileS3key: string, videofilename: string }[];
    dishonests: { switchCount: number, questionId: string }[];
  }) {
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
  
    const blocks: any[] = [
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
          // Slack header text limit is 150 characters
          text: safeText(`📋 Interview Summary: ${interview.candidate?.fullName || 'Unknown'}`, 150),
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: safeText(`*Interview ID:*\n${interview.interviewId || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Schedule ID:*\n${interview.scheduleId || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Candidate ID:*\n${interview.candidate?.id || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Job ID:*\n${interview.jobId || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Browser:*\n${interview.browser || 'N/A'}`) },
          { type: 'mrkdwn', text: safeText(`*Attended:*\n${formatDate(interview.attendedTime)}`) },
          { type: 'mrkdwn', text: safeText(`*Finished Early:*\n${interview.finishedEarly ? 'Yes' : 'No'}`) },
          { type: 'mrkdwn', text: safeText(`*Completion Reason:*\n${this.getCompletionReasonDisplay(interview.completionReason)}`) },
          { type: 'mrkdwn', text: safeText(`*Total Switches (Cheating):*\n${totalSwitches}`) },
        ],
      },
    ];
  
    if (interview.evaluations?.length) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: safeText(`*🎥 Evaluated Questions & Recordings (${interview.evaluations?.length}):*`),
        },
      });
  
      interview.evaluations.forEach((q, i) => {
        const cameraRecording = q.videofileS3key 
          ? UtilsProvider.replaceS3UriWithS3Key(this.configService.bucketName, q.videofileS3key)
          : 'N/A';
        const screenRecording = q.videofilename
          ? UtilsProvider.replaceS3UriWithS3Key(this.configService.bucketName, q.videofilename)
          : 'N/A';
        
        // Question header
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: safeText(`*Question ${i + 1}* (ID: ${q.questionId || 'N/A'})`),
          },
        });
        
        // Camera and Screen recordings
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: safeText(`📹 *Camera:* \`${cameraRecording}\``),
            },
          ],
        });
        
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: safeText(`🖥️ *Screen:* \`${screenRecording}\``),
            },
          ],
        });
        
        // Add divider between questions (except after the last one)
        if (i < interview.evaluations.length - 1) {
          blocks.push({
            type: 'divider',
          });
        }
      });
    }
  
    if (interview.dishonests && interview.dishonests.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: safeText(`*⚠️ Cheating Events (${interview.dishonests.length} entries):*`),
        },
      });
  
      interview.dishonests.forEach((d, i) => {
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: safeText(`*Q${i + 1}:* ${d.questionId || 'N/A'}  •  *Switch count:* ${d.switchCount || 0}`),
            },
          ],
        });
      });
    }

    return blocks;
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
