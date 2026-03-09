import { Rule, RuleType } from '@midwayjs/validate';

import { PaginationDTO } from '../common/common.dto';

export class SwapProviderCreateDTO {
  @Rule(RuleType.string().required())
  provider: string;

  @Rule(RuleType.string().valid('active', 'degraded', 'disabled'))
  status?: 'active' | 'degraded' | 'disabled';

  @Rule(RuleType.number())
  priority?: number;

  @Rule(RuleType.number())
  timeoutMs?: number;

  @Rule(RuleType.number())
  rateLimitQps?: number;

  @Rule(RuleType.object())
  meta?: Record<string, unknown>;
}

export class SwapProviderUpdateDTO {
  @Rule(RuleType.string().valid('active', 'degraded', 'disabled'))
  status?: 'active' | 'degraded' | 'disabled';

  @Rule(RuleType.number())
  priority?: number;

  @Rule(RuleType.number())
  timeoutMs?: number;

  @Rule(RuleType.number())
  rateLimitQps?: number;

  @Rule(RuleType.object())
  meta?: Record<string, unknown>;
}

export class SwapProviderQueryDTO extends PaginationDTO {
  @Rule(RuleType.string())
  provider?: string;

  @Rule(RuleType.string().valid('active', 'degraded', 'disabled'))
  status?: 'active' | 'degraded' | 'disabled';
}

export class SwapProviderItemDTO {
  provider: string;
  status: 'active' | 'degraded' | 'disabled';
  priority: number;
  timeoutMs: number;
  rateLimitQps: number;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class SwapProviderListResponseDTO {
  result: SwapProviderItemDTO[];
  next: string | null;
}
