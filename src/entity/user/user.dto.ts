import { ApiProperty } from '@midwayjs/swagger';
import { Rule, RuleType } from '@midwayjs/validate';

export class UserDTO {
  @ApiProperty({
    description: 'The username for the user',
    example: 'foo',
    nullable: true,
  })
  @Rule(RuleType.string())
  name?: string;

  @ApiProperty({
    description: 'The email for the user',
    example: 'foo@example.com',
  })
  @Rule(RuleType.string().required())
  email: string;

  @ApiProperty({
    description: 'The userId for the user',
    example: '',
  })
  @Rule(RuleType.string())
  userId: string;
}

export class UserQueryDTO {
  @Rule(RuleType.string())
  email: string;
}
