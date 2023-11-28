import { IMidwayContainer, MidwayLoggerService } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as mongoose from '@midwayjs/mongoose';
export declare class ServiceBaseConfiguration {
    app: koa.Application;
    envConfig: string;
    awsConfig: {
        awsAccessKeyId: string;
        awsSecretKey: string;
        awsRegion: string;
    };
    loggerService: MidwayLoggerService;
    dataSourceManager: mongoose.MongooseDataSourceManager;
    onReady(applicationContext: IMidwayContainer): Promise<void>;
}
