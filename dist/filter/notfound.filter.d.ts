import { MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
export declare class NotFoundFilter {
    catch(_err: MidwayHttpError, ctx: Context): Promise<{
        code: number;
        error: string;
        data: any;
    }>;
}
