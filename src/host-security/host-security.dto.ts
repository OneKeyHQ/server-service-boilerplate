import { Rule, RuleType } from '@midwayjs/validate';

export class CheckHostDTO {
  @Rule(RuleType.string().required().max(300))
  url: string;
}
