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
    evaluations: { questionId: string; videofileS3key: string }[];
    dishonests: { switchCount: number }[];
  }) {
    const totalSwitches = interview.dishonests?.reduce((sum, d) => sum + d.switchCount, 0);
  
    const blocks: any[] = [
      {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: '*🎯 New Interview Finished*',
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
          { type: 'mrkdwn', text: `*Total Switches (Cheating):*\n${totalSwitches}` },
        ],
      },
    ];
  
    if (interview.evaluations?.length) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🎥 Evaluated Questions (${interview.evaluations?.length}):*`,
        },
      });
  
      interview.evaluations.forEach((q, i) => {
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Q${i + 1}:* ${q.questionId}  •  *Recording:* ${UtilsProvider.replaceS3UriWithS3Key(q.videofileS3key)}`,
            },
          ],
        });
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
              text: `*Attempt ${i + 1}:* switch_count = ${d.switchCount}`,
            },
          ],
        });
      });
    }

    return blocks;
  }
}
