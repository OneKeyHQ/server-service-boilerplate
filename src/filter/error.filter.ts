import { Catch, ILogger, Logger, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Catch()
export class DefaultErrorFilter {
  @Logger()
  logger: ILogger;

  async catch(err: MidwayHttpError, ctx: Context) {
    this.logger.error(err);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const errcode = err.status || err.response?.status || 400;
    // 所有的未分类错误会到这里
    ctx.status = errcode;
    return {
      code: -1,
      message: err.message,
      data: null,
    };
  }
}
