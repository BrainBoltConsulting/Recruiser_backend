import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SSM } from 'aws-sdk';

@Injectable()
export class SsmService {
  private readonly logger = new Logger(SsmService.name);
  private ssm: SSM;


  constructor() {
    this.ssm = new SSM({
      region: 'us-west-1'
    });
  }


  async getParameter(name: string, withDecryption = true): Promise<string> {
    try {
      const data = await this.ssm.getParameter({ Name: name, WithDecryption: true }).promise();
      return data.Parameter.Value;
    } catch (error) {
      this.logger.error(`Error fetching parameter ${name}: ${error.message}`);
      throw error;
    }
  }
}
