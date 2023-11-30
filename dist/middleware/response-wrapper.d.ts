import { IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
export declare class ResponseWraperMiddleware implements IMiddleware<Context, NextFunction> {
    resolve(): (_: Context, next: Next) => Promise<{
        code: number;
        message: string;
        data: any;
    }>;
    static getName(): string;
}
