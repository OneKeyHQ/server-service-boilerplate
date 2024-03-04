/* eslint-disable no-process-env */

import path from 'path';

import * as dotenv from 'dotenv';

import { NODE_ENV } from './types/config.dto';

// ============================================================================
const PROJECT_NAME = ''; // FIXME: set by your project
if (!PROJECT_NAME) {
  console.log('Please set your own PROJECT_NAME and delete this console');
}

// first load config as default, second load config will not cover prev load config
if (
  [NODE_ENV.LOCAL, NODE_ENV.JEST].includes(process.env.NODE_ENV as NODE_ENV)
) {
  // local load config
  dotenv.populate(
    process.env,
    require(path.resolve(__dirname, '..', 'config.json'))
  );

  // FIXME: deprecated, suggest use config.json only
  dotenv.config({
    path: path.join(__dirname, '..', '.env'),
  });
} else {
  // online load config
  dotenv.populate(
    process.env,
    require(path.resolve('/', 'mnt', 'config', 'config.json'))
  );

  dotenv.populate(
    process.env,
    require(path.resolve(
      '/',
      'mnt',
      'secrets',
      `onekey-eks-${PROJECT_NAME}-${process.env.NODE_ENV}.json`
    ))
  );
}

// ============================================================================
BigInt.prototype['toJSON'] = function () {
  return this.toString();
};
