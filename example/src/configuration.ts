import { join } from 'path';

import * as base from 'service-base';
import * as grpc from '@midwayjs/grpc'
import { Configuration } from 'service-base/dist/midway/core';

@Configuration({
  imports: [base, grpc],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {}
