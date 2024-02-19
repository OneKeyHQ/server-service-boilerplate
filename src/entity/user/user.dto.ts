import { Rule, RuleType } from '@midwayjs/validate';

import { PaginationDTO } from '../common/common.dto';

export class UserDTO {
  @Rule(RuleType.string())
  name?: string;

  @Rule(RuleType.string().required())
  email: string;

  @Rule(RuleType.string())
  userId: string;
}

export class UserQueryDTO extends PaginationDTO {
  @Rule(RuleType.string())
  email: string;
}
