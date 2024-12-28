export interface IAwsS3Config {
    region: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  }