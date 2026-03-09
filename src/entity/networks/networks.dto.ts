import { Rule, RuleType } from '@midwayjs/validate';

import { PaginationDTO } from '../common/common.dto';

export class NetworkCreateDTO {
  @Rule(RuleType.string().required())
  provider: string;

  @Rule(RuleType.string().required())
  chainName: string;

  @Rule(RuleType.string().required())
  chainCode: string;

  @Rule(RuleType.string())
  chainId?: string;

  @Rule(RuleType.string())
  nativeTokenAddress?: string;

  @Rule(RuleType.boolean())
  isActive?: boolean;

  @Rule(RuleType.object())
  metadata?: Record<string, unknown>;

  @Rule(RuleType.date())
  syncedAt?: Date;
}

export class NetworkUpdateDTO {
  @Rule(RuleType.string())
  chainName?: string;

  @Rule(RuleType.string())
  chainId?: string;

  @Rule(RuleType.string())
  nativeTokenAddress?: string;

  @Rule(RuleType.boolean())
  isActive?: boolean;

  @Rule(RuleType.object())
  metadata?: Record<string, unknown>;

  @Rule(RuleType.date())
  syncedAt?: Date;
}

export class NetworkQueryDTO extends PaginationDTO {
  @Rule(RuleType.string())
  provider?: string;

  @Rule(RuleType.string())
  chainCode?: string;

  @Rule(RuleType.string())
  chainId?: string;

  @Rule(RuleType.boolean())
  isActive?: boolean;
}

export class NetworkItemDTO {
  provider: string;
  chainName: string;
  chainCode: string;
  chainId: string;
  nativeTokenAddress: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class NetworkListResponseDTO {
  result: NetworkItemDTO[];
  next: string | null;
}
