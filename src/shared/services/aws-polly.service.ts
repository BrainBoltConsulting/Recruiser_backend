import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class PollyService {
  private readonly polly: AWS.Polly;

  constructor() {
    this.polly = new AWS.Polly({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
    });
  }

  async generateSpeechStream(text: string): Promise<Buffer> {
    const params: AWS.Polly.SynthesizeSpeechInput = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: 'Brian',
    };

    const result = await this.polly.synthesizeSpeech(params).promise();
    console.log(result)
    if (result.AudioStream) {
      return result.AudioStream as Buffer;
    } else {
      throw new Error('Failed to generate speech');
    }
  }

  
}
