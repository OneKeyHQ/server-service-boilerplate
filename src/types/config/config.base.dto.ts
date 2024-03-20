import { Rule, RuleType, getSchema } from '@midwayjs/validate';

export class Redis {
  @Rule(RuleType.string().required())
  host!: string;

  @Rule(RuleType.number().required())
  port!: number;

  @Rule(RuleType.string().required().allow(''))
  password!: string;

  @Rule(RuleType.number().required())
  db!: number;
}

class MongooseOptions {
  @Rule(RuleType.string().optional())
  user?: string;

  @Rule(RuleType.string().optional())
  pass?: string;
}

class MongooseConfig {
  @Rule(RuleType.string().required())
  uri!: string;

  @Rule(getSchema(MongooseOptions).required())
  options!: MongooseOptions;
}

class MongooseDataSource {
  @Rule(getSchema(MongooseConfig).required())
  test?: MongooseConfig;

  @Rule(getSchema(MongooseConfig).required())
  default!: MongooseConfig;
}

export class Mongoose {
  @Rule(getSchema(MongooseDataSource).required())
  dataSource!: MongooseDataSource;
}

export class AWS {
  @Rule(RuleType.string().required())
  awsAccessKeyId!: string;

  @Rule(RuleType.string().required())
  awsSecretKey!: string;

  @Rule(RuleType.string().required())
  awsRegion!: string;
}

export class KOAConfig {
  @Rule(RuleType.number().required())
  port!: number;

  @Rule(RuleType.string().required())
  globalPrefix!: string;
}
