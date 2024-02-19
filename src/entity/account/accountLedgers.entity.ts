import { EntityView } from '@midwayjs/orm';
import { JoinColumn, ManyToOne, ViewColumn } from 'typeorm';

import { Accounts } from './account.entity';

@EntityView('account_ledgers')
export class AccountLedgers {
  @ViewColumn({
    name: 'account_id',
  })
  accountId: number;

  @ViewColumn({
    name: 'transaction_entry_id',
  })
  transactionEntryId: number;

  @ViewColumn()
  amount: number;

  @ManyToOne(() => Accounts, account => account.accountLedgers)
  @JoinColumn({ name: 'account_id' })
  account: Accounts;
}
