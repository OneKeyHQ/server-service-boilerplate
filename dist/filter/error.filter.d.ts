import { ILogger, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
export declare class DefaultErrorFilter {
    logger: ILogger;
    catch(err: MidwayHttpError, ctx: Context): Promise<{
        code: number;
        message: string;
        data: any;
    }>;
}
