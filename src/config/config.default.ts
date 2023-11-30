/* eslint-disable no-console */
/* eslint-disable no-process-env */

import { join } from 'path';

import { MidwayAppInfo, MidwayConfig } from '@midwayjs/core';
import * as redisStore from 'cache-manager-ioredis';

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
    cache: {
      store: customConfig.redis.host ? redisStore : 'memory',
      max: 1000,
      options: {
        ...customConfig.redis,
        keyPrefix: 'cache:discover:',
      },
    },
    mongoose: {
      dataSource: {
        default: {
          ...customConfig.mongoose.dataSource.default,
          // http://midwayjs.org/docs/data_source#2%E7%9B%AE%E5%BD%95%E6%89%AB%E6%8F%8F%E5%85%B3%E8%81%94%E5%AE%9E%E4%BD%93
          entities: ['**/*.entity.ts'],
        },
      },
    },
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
