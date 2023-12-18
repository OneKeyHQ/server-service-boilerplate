import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AWS, Redis } from './config.base.dto';

export enum RUNTIME_ENV_MAP {
  LOCAL = 'local',
  PRODUCTION = 'production',
  TEST = 'test',
}

export class ServerEnv {
  @Type(() => Redis)
  @ValidateNested()
  redis: Redis;

  @Type(() => AWS)
  @ValidateNested()
  aws!: AWS;

  NODE_ENV: RUNTIME_ENV_MAP;

  cookieSignKey: string;
}
