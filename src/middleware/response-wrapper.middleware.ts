import { IMiddleware, Middleware } from '@midwayjs/core';
import * as i18nServiceBasic from '@midwayjs/i18n';
import { Context, NextFunction } from '@midwayjs/koa';

@Middleware()
export class ResponseWrapperMiddleware
  implements IMiddleware<Context, NextFunction>
{
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const result = await next();
      const i18nService = await ctx.requestContext.getAsync(
        i18nServiceBasic.MidwayI18nService
      );
      return {
        code: 0,
        message: i18nService.translate('msg__success'),
        data: result,
      };
    };
  }
}
