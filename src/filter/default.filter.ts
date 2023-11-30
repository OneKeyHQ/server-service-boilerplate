import { Catch, Logger, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { IMidwayLogger } from '@midwayjs/logger';

@Catch()
export class DefaultErrorFilter {
  @Logger()
  logger: IMidwayLogger;
  async catch(err: MidwayHttpError, ctx: Context) {
    // @ts-ignore
    const errcode = err.status || err.response?.status || 400;
    // 所有的未分类错误会到这里
    ctx.status = errcode;
    this.logger.error(err);
    return {
      code: -1,
      message: err.message,
      data: null,
    };
  }
}
