import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import type { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

import type { Manager } from '../../entities/Manager';
import { ApiConfigService } from './api-config.service';
import { S3Service } from './aws-s3.service';

@Injectable()
export class MailService {
  public readonly logoSrc: string = '';

  public readonly footerImg: string = '';

  constructor(
    private readonly httpService: HttpService,
    private readonly s3Service: S3Service,
    private readonly mailerService: MailerService,
    private readonly configService: ApiConfigService,
  ) {}

  async send(mailData: ISendMailOptions): Promise<void> {
    mailData.from = mailData.from || this.configService.defoultMailFrom;
    await this.mailerService.sendMail(mailData);
  }

  sendInvitationForAMeeting(
    firstName: string,
    manager: Manager,
    primarySkill: string,
    meetingLink: string,
  ) {
    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Meeting Invitation</title>
            <style>

                body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
                color: #333;
                }
                .email-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                color: rgba(152, 210, 57, 1);
                text-align: center;
                padding: 0px 10px;
                }
                .header h1 {
                margin: 0;
                font-size: 24px;
                }
                .header p {
                margin: 5px 0 0;
                font-size: 14px;
                }
                .content {
                padding: 20px;
                line-height: 1.6;
                }
                .content h2 {
                color: rgba(152, 210, 57, 1);   
                font-size: 20px;
                }
              
                .cta-button {
                    display: inline-block;
                    background: linear-gradient(90deg, rgba(71, 198, 99, 1), rgba(152, 210, 57, 1), rgba(194, 228, 67, 1));
                    color: blue;
                    text-decoration: none;
                    font-size: 16px;
                    padding: 12px 24px;
                    border-radius: 5px;
                    text-align: center;
                    margin: 20px 0;
                    }
                .cta-button a[href] {
                    color: blue;
                }
                .cta-button:hover {
                opacity: 0.7
                }
                .footer {
                background-color: #f5f5f5;
                color: #888;
                text-align: center;
                font-size: 12px;
                padding: 10px;
                }
                .footer a {
                color: #4A90E2;
                text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                ${manager.logoS3key ? `<img src="${
                  this.s3Service.generatePublicUrl(manager.logoS3key)
                }" alt="Company Logo" style="width: 100px; height: 100px; display: block; margin: 0 auto;">` : ''}
                <h1 style="text-align: center;">Welcome to ${
                  manager.company || 'Hire2o'
                }</h1>
                <p><em>Powered by <a href="https://hire2o.ai">Hire2o.ai</a></em></p>
                </div>
  
                <div class="content">
                <h2>Hi ${firstName},</h2>
                <p>
                    You've been invited to join a meeting. This is a great opportunity to connect and communicate smoothly using our solution. 
                    Please find the meeting details below:
                </p>
  
                <p><strong>Meeting Title:</strong> ${primarySkill} Interview</p>
  
                <h3>Read carefully before taking your interview:</h3>
                <p><strong>Duration</strong></p>
                <ul>
                  <li>Your interview will take about 25-30 mins</li>
                  <li>Make sure that your camera and microphone is on</li>
                  <li>Make sure you are in a well lit and a quiet area</li>
                </ul>
  
                <p><strong>Technical Requirements</strong></p>
                <ul>
                  <li>Close all other applications and browser tabs immediately</li>
                  <li>Keep only the interview window open during the entire session</li>
                </ul>
  
                <p><strong>Interview Policy</strong></p>
                <ul>
                  <li>You have <strong>ONE opportunity</strong> to complete this technical assessment</li>
                  <li>This is your only attempt, so ensure you're in a quiet environment and fully prepared</li>
                  <li>Once started, the interview cannot be paused or restarted</li>
                </ul>
  
                <p><strong>Responding to Questions</strong></p>
                <ul>
                  <li>Begin your answers <strong>only when you see "I am listening..." displayed</strong> at the top of your screen. This indicator is your signal to start speaking</li>
                  <li>Wait for this prompt after each question before providing your response</li>
                  <li>You cannot go to previous question by pressing back button.</li>
                  <li>You can finish your interview anytime by clicking the Finish Interview button</li>
                </ul>
                <p>
                    <strong>Please review a short video to familiarize with the interview process</strong>
                </p>
                <p>
                    <a href="https://hire2o.com/a7f3b9c1d8e2">Watch the video</a>
                </p>
  
                <p>
                    To join the meeting, simply click the button below:
                </p>
  
                <p style="text-align: center;">
                    <a href=${meetingLink} class="cta-button">Join the Meeting</a>
                </p>
  
                <p>
                    Please ensure you check your audio and video settings before the meeting
                    to avoid any interruptions. Our solution makes it easy to do a quick
                    pre-check for both.
                </p>
                </div>
  
                <div class="footer">
                <p>
                    Need assistance? Visit our <a href="https://backend.hire2o.net/contact-us">Help Center</a> or contact us at 
                    <a href="mailto:info@hire2o.com">info@hire2o.com</a>.
                </p>
                </div>
            </div>
        </body>
    </html>
    `;
  }

  sendInterviewCompletionNotification(
    candidateFirstName: string,
    candidateMiddleName: string | null,
    candidateLastName: string,
    candidateId: string,
    manager: {
      managerEmail: string;
      firstName: string | null;
      middleName: string | null;
      lastName: string | null;
      company: string | null;
      logoS3key: string | null;
    },
  ) {
    const fullName = [
      candidateFirstName,
      candidateMiddleName,
      candidateLastName,
    ]
      .filter(Boolean)
      .join(' ');

    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Interview Completion Notification</title>
            <style>
                body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
                color: #333;
                }
                .email-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                color: rgba(152, 210, 57, 1);
                text-align: center;
                padding: 0px 10px;
                }
                .header h1 {
                margin: 0;
                font-size: 24px;
                }
                .header p {
                margin: 5px 0 0;
                font-size: 14px;
                }
                .content {
                padding: 20px;
                line-height: 1.6;
                }
                .content h2 {
                color: rgba(152, 210, 57, 1);   
                font-size: 20px;
                }
                .do-not-reply {
                color: #888;
                font-size: 12px;
                margin-bottom: 20px;
                font-style: italic;
                }
                .footer {
                background-color: #f5f5f5;
                color: #888;
                text-align: center;
                font-size: 12px;
                padding: 10px;
                }
                .footer a {
                color: #4A90E2;
                text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                ${manager.logoS3key ? `<img src="${
                  this.s3Service.generatePublicUrl(manager.logoS3key)
                }" alt="Company Logo" style="width: 100px; height: 100px; display: block; margin: 0 auto;">` : ''}
                <h1 style="text-align: center;">${
                  manager.company || 'Hire2o'
                }</h1>
                <p><em>Powered by <a href="https://hire2o.ai">Hire2o.ai</a></em></p>
                </div>
  
                <div class="content">
                <p class="do-not-reply">Do Not Reply: This message was sent from an unmonitored mailbox.</p>
                
                <h2>Hello,</h2>
                <p>
                    This is to inform you that your candidate has successfully completed
                    the interview. The evaluation report is now available on the Reports
                    page in your Hire2o.ai dashboard.
                </p>
                
                <p>
                    Thank you for choosing Hire2o.ai.
                </p>
                
                <p>
                    <strong>Support Team</strong><br>
                    Hire2o.ai
                </p>
                </div>
  
                <div class="footer">
                <p>
                    Need assistance? Visit our
                    <a href="https://backend.hire2o.net/contact-us">Help Center</a>
                    or contact us at
                    <a href="mailto:info@hire2o.com">info@hire2o.com</a>.
                </p>
                </div>
            </div>
        </body>
    </html>
    `;
  }
}
