import { Injectable } from '@nestjs/common';
import { SSM } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsParameterStoreProvider {
    private configValues: Record<string, string>;
    private readonly ssm: SSM

    constructor(
    ) {
        this.ssm = new SSM({ region: 'us-west-1'});
        this.configValues = {};
    }

    async loadConfig(): Promise<void> {
        // const params = {
        //     Name: 'api-secrets-prod',
        //     WithDecryption: true
        // };

        try {
            const result = await this.ssm.getParameter().promise();
            this.configValues = JSON.parse(result.Parameter.Value);
        } catch (error) {
            console.error('Failed to load configuration from Parameter Store:', error);
        }
    }

    getConfig(): Record<string, string> {
        return this.configValues;
    }
}
