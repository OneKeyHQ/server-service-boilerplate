import { Rule, RuleType, getSchema } from '@midwayjs/validate';

import { AWS, KOAConfig, Redis } from './config.base.dto';

export enum RUNTIME_ENV_MAP {
  LOCAL = 'local',
  PRODUCTION = 'production',
  TEST = 'test',
  JEST = 'jest',
}

export class ServerEnv {
  @Rule(getSchema(Redis).required())
  redis: Redis;

  @Rule(getSchema(AWS).required())
  aws!: AWS;

  @Rule(RuleType.string().required())
  NODE_ENV: RUNTIME_ENV_MAP;

  @Rule(RuleType.string().required())
  keys: string;

  @Rule(getSchema(KOAConfig).required())
  koa: KOAConfig;
}
