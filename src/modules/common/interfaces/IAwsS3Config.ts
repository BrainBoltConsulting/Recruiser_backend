export interface IAwsS3Config {
    region: string;
    cloudWatchInterviewGroupName: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  }