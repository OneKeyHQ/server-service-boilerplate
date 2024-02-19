import { Catch, MidwayHttpError } from '@midwayjs/core';
import { Config } from '@midwayjs/core';
import * as i18nServiceBasic from '@midwayjs/i18n';
import { Context } from '@midwayjs/koa';

@Catch()
export class DefaultErrorFilter {
  @Config('NODE_ENV')
  NODE_ENV: string;

  async catch(err: MidwayHttpError, ctx: Context) {
    const status = err.status;

    /** handle HTTP Error */
    const i18nService = await ctx.requestContext.getAsync(
      i18nServiceBasic.MidwayI18nService
    );
    const statusMessage =
      i18nService.translate(`error__http_${status}`) ??
      i18nService.translate('error__common_unknown');
    let shownMessage = `${status}: ${statusMessage}`;
    /** handle HTTP Error */

    /** handle Business Error */
    if (status > 30000 && status < 40000) {
      shownMessage = `${i18nService.translate(err.message) ?? err.message}`;
    }
    /** handle Business Error */

    if (this.NODE_ENV === 'local') {
      console.log(err);
    }

    ctx.status = 200;
    return {
      code: status,
      message: shownMessage,
      data: null,
    };
  }
}
