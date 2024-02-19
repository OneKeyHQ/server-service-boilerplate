import { EntityModel } from '@midwayjs/orm';
import {
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { AccountLedgers } from './accountLedgers.entity';
import { Users } from './users.entity';

@EntityModel('accounts')
export class Accounts {
  @PrimaryColumn()
  id: number;

  @Column()
  type: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Users, user => user.accounts)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToMany(() => AccountLedgers, accountLedgers => accountLedgers.account)
  accountLedgers: AccountLedgers[];
}
