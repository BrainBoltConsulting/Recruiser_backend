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
      await axios.post(this.webhookUrl, blockPayload);
      this.logger.log('Slack block message sent.');
    } catch (error) {
      this.logger.error('Failed to send Slack block message', error);
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
    const totalSwitches = interview.dishonests?.reduce((sum, d) => sum + Number(d.switchCount), 0);
    
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
            text: `*${style.emoji} ${style.title}*`,
        },
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📋 Interview Summary: ${interview.candidate.fullName}`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Interview ID:*\n${interview.interviewId}` },
          { type: 'mrkdwn', text: `*Schedule ID:*\n${interview.scheduleId}` },
          { type: 'mrkdwn', text: `*Candidate ID:*\n${interview.candidate.id}` },
          { type: 'mrkdwn', text: `*Job ID:*\n${interview.jobId}` },
          { type: 'mrkdwn', text: `*Browser:*\n${interview.browser}` },
          { type: 'mrkdwn', text: `*Attended:*\n${interview.attendedTime}` },
          { type: 'mrkdwn', text: `*Finished Early:*\n${interview.finishedEarly ? 'Yes' : 'No'}` },
          { type: 'mrkdwn', text: `*Completion Reason:*\n${this.getCompletionReasonDisplay(interview.completionReason)}` },
          { type: 'mrkdwn', text: `*Total Switches (Cheating):*\n${totalSwitches}` },
        ],
      },
    ];
  
    if (interview.evaluations?.length) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🎥 Evaluated Questions & Recordings (${interview.evaluations?.length}):*`,
        },
      });
  
      interview.evaluations.forEach((q, i) => {
        const cameraRecording = UtilsProvider.replaceS3UriWithS3Key(this.configService.bucketName, q.videofileS3key);
        const screenRecording = UtilsProvider.replaceS3UriWithS3Key(this.configService.bucketName, q.videofilename);
        
        // Question header
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Question ${i + 1}* (ID: ${q.questionId})`,
          },
        });
        
        // Camera and Screen recordings
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📹 *Camera:* \`${cameraRecording}\``,
            },
          ],
        });
        
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🖥️ *Screen:* \`${screenRecording}\``,
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
  
    if (interview.dishonests.length) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*⚠️ Cheating Events (${interview.dishonests.length} entries):*`,
        },
      });
  
      interview.dishonests.forEach((d, i) => {
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Q${i + 1}:* ${d.questionId}  •  *Switch count:* ${d.switchCount}`,
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
