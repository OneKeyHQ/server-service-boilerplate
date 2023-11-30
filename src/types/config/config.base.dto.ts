import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
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

export class Goplus {
  @IsString()
  @IsNotEmpty()
  appKey!: string;

  @IsString()
  @IsNotEmpty()
  appSecret!: string;
}
