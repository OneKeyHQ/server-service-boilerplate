import { IMiddleware, Middleware } from '@midwayjs/core';
import * as i18nServiceBasic from '@midwayjs/i18n';
import { Context, NextFunction } from '@midwayjs/koa';

@Middleware()
export class LocaleMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const locale = ctx.request.header['x-onekey-request-locale'];
      const i18nService = await ctx.requestContext.getAsync(
        i18nServiceBasic.MidwayI18nService
      );

      await i18nService.saveRequestLocale(locale as string);
      return next();
    };
  }
}
