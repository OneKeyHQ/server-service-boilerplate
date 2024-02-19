/* eslint-disable no-console */
/* eslint-disable no-process-env */

import { MidwayConfig } from '@midwayjs/core';
import { merge } from 'lodash';

import { baseConfig } from './base';

export default (): MidwayConfig => {
  return merge(baseConfig, {
    midwayLogger: {
      default: {
        console: false,
        file: false,
      },
    },
  }) as MidwayConfig;
};
