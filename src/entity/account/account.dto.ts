import { Rule, RuleType } from '@midwayjs/validate';

export class CreateUserDTO {
  @Rule(RuleType.string().required())
  hashPubKey: string;

  @Rule(RuleType.string().required())
  address: string;

  @Rule(RuleType.string().required())
  signature: string;

  @Rule(RuleType.number().required())
  randomSeed: number;

  @Rule(RuleType.boolean().required())
  testnet: boolean;
}

export class ExchangeTokenDTO {
  @Rule(RuleType.string().required())
  hashPubKey: string;

  @Rule(RuleType.string().required())
  address: string;

  @Rule(RuleType.string().required())
  signature: string;

  @Rule(RuleType.number().required())
  timestamp: number;

  @Rule(RuleType.string())
  refreshToken?: string;

  @Rule(RuleType.number().required())
  randomSeed: number;

  @Rule(RuleType.boolean().required())
  testnet: boolean;
}

export class CommonQueryDTO {
  @Rule(RuleType.string().required())
  address: string;

  @Rule(RuleType.boolean().required())
  testnet: boolean;
}

export class TestnetDTO {
  @Rule(RuleType.boolean().required())
  testnet: boolean;
}

export class BatchGetBalanceDTO {
  @Rule(RuleType.array().required())
  addresses: string[];

  @Rule(RuleType.boolean().required())
  testnet: boolean;
}

export class GetSignTemplateDTO {
  @Rule(RuleType.string().required())
  address: string;

  @Rule(RuleType.string().required())
  signType: 'register' | 'auth' | 'transfer';

  @Rule(RuleType.boolean().required())
  testnet: boolean;
}
