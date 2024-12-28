const AWS = require('aws-sdk');

export async function fetchConfigFromParameterStore() {

    if (process.env.LOCAL_AWS_ACCOUNT_NAME) {
        console.log(`We will use your account name as ${process.env.LOCAL_AWS_ACCOUNT_NAME} for connecting to AWS`);
        AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: process.env.LOCAL_AWS_ACCOUNT_NAME });
    }
    

    const ssm = new AWS.SSM({ region: 'us-west-1'});
    // const params = {
    //     Name: '',
    //     WithDecryption: true
    // };

    try {
        const result = await ssm.getParameter().promise();
        const value = result.Parameter.Value;
        const jsonValue = JSON.parse(value); 
        for (const key in jsonValue) {
            process.env[key] = jsonValue[key];
        }
        console.log('Environment variables successfully fetched from parameter store', result)      
    } catch (error) {
        console.error('Failed to fetch configuration from Parameter Store:', error);
        process.exit(1);
    }
}

