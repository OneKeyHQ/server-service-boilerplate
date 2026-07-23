import { getSchema, Rule, RuleType } from '@midwayjs/validate';

// ============================================================================
export enum NODE_ENV {
  LOCAL = 'local',
  JEST = 'jest',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

// ============================================================================
class AwsDTO {
  @Rule(RuleType.string().allow('').required())
  awsAccessKeyId!: string;

  @Rule(RuleType.string().allow('').required())
  awsSecretKey!: string;

  @Rule(RuleType.string().allow('').required())
  awsRegion!: string;
}

// ============================================================================

class RedisDTO {
  @Rule(RuleType.string().required())
  host!: string;

  @Rule(RuleType.number().integer().positive().required())
  port!: number;

  @Rule(RuleType.string().allow('').required())
  password!: string;

  @Rule(RuleType.number().integer().min(0).required())
  db!: number;
}

// ============================================================================
class MongooseDataSourceManagerOptionsDTO {
  @Rule(RuleType.string().allow('').required())
  user!: string;

  @Rule(RuleType.string().allow('').required())
  pass!: string;
}

class MongooseDataSourceManagerDTO {
  @Rule(RuleType.string().required())
  uri!: string;

  @Rule(getSchema(MongooseDataSourceManagerOptionsDTO).required())
  options: MongooseDataSourceManagerOptionsDTO;
}

class MongooseDataSourceDTO {
  @Rule(getSchema(MongooseDataSourceManagerDTO).required())
  default!: MongooseDataSourceManagerDTO;

  @Rule(getSchema(MongooseDataSourceManagerDTO))
  test?: MongooseDataSourceManagerDTO;
}

class MongooseDTO {
  @Rule(getSchema(MongooseDataSourceDTO).required())
  dataSource!: MongooseDataSourceDTO;
}

// ============================================================================
class KoaDTO {
  @Rule(RuleType.number().required())
  port!: number;

  @Rule(RuleType.string().allow('').required())
  globalPrefix!: string;
}

// ============================================================================

export class ConfigDTO {
  @Rule(
    RuleType.string()
      .valid(...Object.values(NODE_ENV))
      .required()
  )
  NODE_ENV!: NODE_ENV;

  @Rule(RuleType.string().required().description('cookieSignKey'))
  keys!: string;

  @Rule(getSchema(KoaDTO).required())
  koa: KoaDTO;

  @Rule(getSchema(AwsDTO).required())
  aws!: AwsDTO;

  @Rule(getSchema(MongooseDTO).required())
  mongoose: MongooseDTO;

  @Rule(getSchema(RedisDTO).required())
  redis: RedisDTO;
}
