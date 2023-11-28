import { ApiProperty } from '@midwayjs/swagger';
import { Rule, RuleType } from '@midwayjs/validate';

export class HealthDTO {
  @Rule(RuleType.string().required())
  @ApiProperty({
    description: 'status',
    example: 'ok',
  })
  status: string;
}
