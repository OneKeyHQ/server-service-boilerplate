/* eslint-disable no-console */
/* eslint-disable no-process-env */

import { join } from 'path';

import { MidwayAppInfo, MidwayConfig } from 'service-base/dist/midway/core';

import { customConfig } from './config.custom';
import { NODE_ENV_MAP } from './constant';

export default (appInfo: MidwayAppInfo): MidwayConfig => {
  return {
    env: customConfig.NODE_ENV || NODE_ENV_MAP.LOCAL,
    keys: customConfig.cookieSignKey,
    koa: {
      port: 7001,
    },
    midwayLogger: {
      default: {
        console:
          customConfig.NODE_ENV !== NODE_ENV_MAP.PRODUCTION &&
          customConfig.NODE_ENV !== NODE_ENV_MAP.TEST,
        file: false,
      },
    },
    redis: {
      client: customConfig.redis,
    },
    mongoose: customConfig.mongoose,
    bull: {
      defaultQueueOptions: {
        redis: {
          port: +customConfig.redis.port,
          host: customConfig.redis.host,
          password: customConfig.redis.password,
        },
      },
    },
    grpc: {
      services: [
        {
          url: 'localhost:6565',
          protoPath: join(appInfo.appDir, 'proto/network.proto'),
          package: 'token',
        },
      ],
    },
    aws: {
      awsAccessKeyId: customConfig.aws.awsAccessKeyId,
      awsSecretKey: customConfig.aws.awsSecretKey,
      awsRegion: customConfig.aws.awsRegion,
    },
  } as MidwayConfig;
};
