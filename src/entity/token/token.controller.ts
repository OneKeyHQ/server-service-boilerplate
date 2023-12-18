import { Controller, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { TokenService } from './token.service';

@Controller('/token')
export class UserController {
  @Inject()
  ctx: Context;

  @Inject()
  service: TokenService;

  @Get('/')
  async getList() {
    return this.service.getNetworks();
  }

  @Get('/:name')
  async get() {
    // const { name } = this.ctx.params;
    return this.service.getToken();
  }
}
