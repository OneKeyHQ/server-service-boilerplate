import { Catch, MidwayHttpError } from '@midwayjs/core';
import { Config } from '@midwayjs/core';
import * as i18nServiceBasic from '@midwayjs/i18n';
import { Context } from '@midwayjs/koa';

@Catch()
export class DefaultErrorFilter {
  @Config('NODE_ENV')
  NODE_ENV: string;

  async catch(err: MidwayHttpError, ctx: Context) {
    const status = this.resolveStatus(err);
    const message = err.message;

    /** handle HTTP Error */
    const i18nService = await ctx.requestContext.getAsync(
      i18nServiceBasic.MidwayI18nService
    );
    const statusKey = `error__http_${status}`;
    const translatedStatus = i18nService.translate(statusKey);
    const fallback = i18nService.translate('error__common_unknown');
    const statusMessage =
      translatedStatus && translatedStatus !== statusKey
        ? translatedStatus
        : fallback;
    const shownMessage = `${status}: ${statusMessage}`;
    /** handle HTTP Error */

    if (this.NODE_ENV === 'local') {
      console.log(err);
    }

    ctx.status = 200;
    return {
      code: status,
      message: shownMessage,
      data: message,
    };
  }

  private resolveStatus(err: MidwayHttpError): number {
    const status = Number((err as { status?: unknown })?.status);
    return Number.isFinite(status) && status > 0 ? status : 500;
  }
}
