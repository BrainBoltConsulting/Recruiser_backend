import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { MailerService } from '@nestjs-modules/mailer';
import type { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class MailService {
    public readonly logoSrc: string = ''
    public readonly footerImg: string = ''

  constructor(
    private readonly httpService: HttpService,
    private readonly mailerService: MailerService,
    private readonly configService: ApiConfigService,
  ) {}

  async send(mailData: ISendMailOptions): Promise<void> {
    mailData.from = mailData.from || this.configService.defoultMailFrom;
    await this.mailerService.sendMail(mailData);
  }


  sendInvitationForAMeeting(firstName: string, primarySkill: string, meetingLink: string) {
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
                background-color: #4A90E2; /* Adjust this to match Canint's primary color */
                color: white;
                text-align: center;
                padding: 20px 10px;
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
                color: #4A90E2; /* Matching the brand color */
                font-size: 20px;
                }
                .cta-button {
                display: inline-block;
                background-color: #adc3e4; /* Primary button color */
                color: #ffffff;
                text-decoration: none;
                font-size: 16px;
                padding: 12px 24px;
                border-radius: 5px;
                text-align: center;
                margin: 20px 0;
                }
                .cta-button:hover {
                background-color: #357ABD; /* Slightly darker shade for hover effect */
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
                <!-- Header Section -->
                <div class="header">
                <h1>Welcome to Canint!</h1>
                <p>Your trusted platform for seamless video interviews</p>
                </div>

                <!-- Content Section -->
                <div class="content">
                <h2>Hi ${firstName},</h2>
                <p>
                    You’ve been invited to join a meeting on <strong>Canint</strong>. This is a great opportunity to connect and communicate smoothly using our platform. Please find the meeting details below:
                </p>

                <p><strong>Meeting Title:</strong> ${primarySkill} interview</p>

                <p>
                    To join the meeting, simply click the button below:
                </p>

                <!-- Call-to-Action Button -->
                <p style="text-align: center;">
                    <a href=${meetingLink} class="cta-button">Join the Meeting</a>
                </p>

                <p>
                    Please ensure you check your audio and video settings before the meeting to avoid any interruptions. Our platform makes it easy to do a quick pre-check for both.
                </p>
                </div>

                <!-- Footer Section -->
                <div class="footer">
                <p>
                    Need assistance? Visit our <a href="[Support Page Link]">Help Center</a> or contact us at 
                    <a href="mailto:support@canint.com">support@canint.com</a>.
                </p>
                <p>Thank you for choosing Canint!</p>
                </div>
            </div>
        </body>
    </html>

    `
  }



  
}
