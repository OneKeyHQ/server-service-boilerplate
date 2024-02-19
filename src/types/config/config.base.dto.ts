import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class Redis {
  @IsString()
  @IsNotEmpty()
  host!: string;

  @IsNumber()
  port!: number;

  @IsString()
  password!: string;

  @IsNumber()
  db!: number;
}

class MongooseOptions {
  @IsString()
  @IsOptional()
  user?: string;

  @IsString()
  @IsOptional()
  pass?: string;
}

class MongooseConfig {
  @IsString()
  uri!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => MongooseOptions)
  options!: MongooseOptions;
}

class MongooseDataSource {
  @IsObject()
  @ValidateNested()
  @Type(() => MongooseConfig)
  @IsOptional()
  test?: MongooseConfig;

  @IsObject()
  @ValidateNested()
  @Type(() => MongooseConfig)
  default!: MongooseConfig;
}

export class Mongoose {
  @IsObject()
  @ValidateNested()
  @Type(() => MongooseDataSource)
  dataSource!: MongooseDataSource;
}

export class AWS {
  @IsString()
  awsAccessKeyId!: string;

  @IsString()
  awsSecretKey!: string;

  @IsString()
  awsRegion!: string;
}

export class Lokalise {
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  projectId!: string;

  @IsString()
  token?: string;
}

export class LndRpc {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  rpcHost!: string;

  @IsString()
  grpcHost!: string;

  @IsString()
  websocketHost!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  grpcMacaroon!: string;

  @IsString()
  grpcCert!: string;

  @IsString()
  @IsNotEmpty()
  withdrawAddress!: string;
}

export class Lndhub {
  @IsString()
  @IsNotEmpty()
  baseUrl!: string;

  @IsNumber()
  jwtAccessExpiry!: number;

  @IsNumber()
  jwtRefreshExpiry!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  adminToken!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  identityPubKey!: string;

  @IsNumber()
  @IsOptional()
  maxReceiveAmount?: number;

  @IsNumber()
  @IsOptional()
  maxSendAmount?: number;
}

export class Postgres {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  url!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  testnetUrl!: string;
}
