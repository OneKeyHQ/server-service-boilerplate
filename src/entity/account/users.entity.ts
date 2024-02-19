import { EntityModel } from '@midwayjs/orm';
import {
  Column,
  CreateDateColumn,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Accounts as Account } from './account.entity';

@EntityModel('users')
export class Users {
  @PrimaryColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  login: string;

  @Column()
  password: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;

  // Make sure to define accounts here
  @OneToMany(() => Account, account => account.user)
  accounts: Account[];
}
