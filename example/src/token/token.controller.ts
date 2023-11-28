import { Controller, Get, Inject } from 'service-base/dist/midway/core';
import { TokenService } from './token.service';
import { Context } from '@midwayjs/koa';

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
    const { name } = this.ctx.params;
    return this.service.getToken(name);
  }
}