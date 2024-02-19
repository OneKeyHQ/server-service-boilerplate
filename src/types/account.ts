import type { Users } from '../entity/account/users.entity';

export type ICreateUserResponse = {
  id: number;
  login: string;
  password: string;
};

export type IAuthParams = {
  login: string;
  password: string;
  refresh_token: string;
};

export type IAuthResponse = {
  access_token: string;
  refresh_token: string;
};

export type IBalanceResponse = {
  balance: number;
  currency: string;
  unit: string;
};

export type IFetchUsersParams = {
  page: number;
  size: number;
  loginQuery?: string;
  testnet: boolean;
};

export type UserWithBalance = Users & { balance: string };

export type IFetchUsersResponse = {
  data: UserWithBalance[];
  pageSize: number;
  currentPage: number;
  totalPage: number;
  totalUserCount: number;
};
