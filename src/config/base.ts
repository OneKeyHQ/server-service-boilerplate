/* eslint-disable no-process-env */
import { join } from 'path';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import * as dotenv from 'dotenv';

import localeConfig from '../locales';
import { ServerEnv } from '../types/config/config.dto';

dotenv.config({
  path: join(__dirname, '../../.env'),
});

export const getRedisConfig = (
  db = 0,
  options: Record<string, unknown> = {}
) => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  password: process.env.REDIS_PWD,
  db,
  ...options,
});

const envConfig = {
  redis: getRedisConfig(parseInt(process.env.REDIS_DB, 10)),
  mongoose: {
    dataSource: {
      default: {
        uri: process.env.MONGODB_URI,
        options: {
          user: process.env.MONGODB_USER,
          pass: process.env.MONGODB_PASSWORD,
        },
      },
    },
  },
  NODE_ENV: process.env.NODE_ENV,
  aws: {
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_KEY,
    awsRegion: process.env.AWS_REGION,
  },
  keys: process.env.COOKIE_SIGN_KEY,
  i18n: {
    defaultLocale: 'en-us',
    localeTable: localeConfig,
    fallbacks: {
      '*': 'en-us',
    },
    writeCookie: false,
    resolver: false,
  },
};

function getBaseConfig() {
  const parsed = plainToInstance(ServerEnv, envConfig);
  const validationErr = validateSync(parsed);

  if (validationErr.length > 0) {
    const simpleErrs = [];
    // eslint-disable-next-line no-console
    console.error(validationErr);

    validationErr.forEach(err => {
      if (err.children && err.children.length > 0) {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(err.children || {}));
        simpleErrs.push(err.children[0].constraints);
      } else {
        simpleErrs.push(err.constraints);
      }
    });

    throw new Error(`Invalid custom config ${JSON.stringify(simpleErrs)}`);
  }

  return envConfig;
}

export const baseConfig = getBaseConfig();
