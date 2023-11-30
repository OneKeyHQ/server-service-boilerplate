import { IMiddleware, Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';

@Middleware()
export class ResponseWraperMiddleware
  implements IMiddleware<Context, NextFunction>
{
  resolve() {
    return async (_: Context, next: NextFunction) => {
      const result = await next();
      return {
        code: 0,
        message: 'success',
        data: result,
      };
    };
  }

  static getName(): string {
    return 'report';
  }
}
