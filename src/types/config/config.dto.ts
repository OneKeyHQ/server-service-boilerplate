import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  AWS,
  LndRpc,
  Lndhub,
  Lokalise,
  Postgres,
  Redis,
} from './config.base.dto';

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

  @Type(() => Lokalise)
  @ValidateNested()
  lokalise!: Lokalise;

  @Type(() => LndRpc)
  @ValidateNested()
  lndRpc!: LndRpc;

  @Type(() => LndRpc)
  @ValidateNested()
  lndRpcTestnet!: LndRpc;

  @Type(() => Lndhub)
  @ValidateNested()
  lndhub!: Lndhub;

  @Type(() => Lndhub)
  @ValidateNested()
  lndhubTestnet!: Lndhub;

  @Type(() => Postgres)
  @ValidateNested()
  postgres: Postgres;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  lndhubJwtSecret!: string;

  @IsString()
  @IsNotEmpty()
  lnurlEndpoint: string;
}
