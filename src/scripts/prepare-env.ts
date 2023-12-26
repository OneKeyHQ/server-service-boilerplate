/* eslint-disable no-process-env */
import * as fs from 'fs';

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

import type { GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';

const AWS_REGION = 'ap-southeast-1';

const client = new SecretsManagerClient({
  region: AWS_REGION,
});

async function run() {
  // load secrets from AWS Secrets Manager
  // This is not used NODE_ENV_MAP here because the constant file may use custom config, which will result in an error if the constant is referenced
  if (
    process.env.NODE_ENV === 'sandbox' ||
    process.env.NODE_ENV === 'production'
  ) {
    let retry = 1;
    let awsSecretsString = '';
    const maxRetry = 5;
    const SECRET_NAME = `onekey_lightning_network_server_${process.env.NODE_ENV}_env`;

    const getAwsSecretString = (data: GetSecretValueCommandOutput) => {
      if (data.SecretString) {
        awsSecretsString = data.SecretString;
      }
    };

    while (retry) {
      try {
        if (retry > 1)
          // eslint-disable-next-line no-console
          console.log(`${retry}: Env failed to get, will retry after 1 second`);
        await client
          .send(
            new GetSecretValueCommand({
              SecretId: SECRET_NAME,
            })
          )
          .then(getAwsSecretString);

        if (awsSecretsString.length > 10) break;

        throw new Error('retry');
      } catch (err) {
        if (retry >= maxRetry) {
          throw new Error('Failed to get env from AWS Secrets Manager');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        retry += 1;
      }
    }

    let envString = '';
    const awsSecrets: object = JSON.parse(awsSecretsString);
    for (const key in awsSecrets) {
      if (Object.prototype.hasOwnProperty.call(awsSecrets, key)) {
        const keyV: string = awsSecrets[key];
        envString += `${key}=${keyV}\n`;
      }
    }

    fs.writeFileSync('.env.default', envString, 'utf8');
  }
}

run();
