import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AWS, Goplus, Mongoose, Redis } from './config.base.dto';

export class ServerEnv {
  @Type(() => Redis)
  @ValidateNested()
  redis: Redis;

  @Type(() => Mongoose)
  @ValidateNested()
  mongoose!: Mongoose;

  @Type(() => AWS)
  @ValidateNested()
  aws!: AWS;

  NODE_ENV?: string;

  cookieSignKey!: string;

  @Type(() => Goplus)
  @ValidateNested()
  goplus: Goplus;
}
