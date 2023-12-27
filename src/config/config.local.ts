/* eslint-disable no-console */
/* eslint-disable no-process-env */

import { MidwayConfig } from '@midwayjs/core';
import * as redisStore from 'cache-manager-ioredis';
import { merge } from 'lodash';

import { baseConfig, getRedisConfig } from './base';

export default (): MidwayConfig => {
  return merge(baseConfig, {
    koa: {
      port: 7007,
    },
    midwayLogger: {
      default: {
        console: false,
        file: false,
      },
    },
    cache: {
      store: redisStore,
      max: 1000,
      options: {
        keyPrefix: 'cache:lightning:',
      },
    },
    bull: {
      defaultQueuOptions: {
        redis: getRedisConfig(),
      },
      defaultConcurrency: 1,
      clearRepeatJobWhenStart: true,
    },
  }) as MidwayConfig;
};
