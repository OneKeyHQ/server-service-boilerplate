import { Init, Provide } from '@midwayjs/core';

@Provide()
export class TokenService {
  @Init()
  async init() {}

  async getNetworks() {}

  async getToken() {}
}
