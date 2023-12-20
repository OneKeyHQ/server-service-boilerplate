import { Rule, RuleType } from '@midwayjs/validate';

export class PaginationDTO {
  @Rule(RuleType.string().length(12))
  cursor?: string;

  @Rule(RuleType.number())
  limit?: number;
}
