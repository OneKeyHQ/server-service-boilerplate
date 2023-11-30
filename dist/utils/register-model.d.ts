import { IMidwayContainer } from '@midwayjs/core';
import { MongooseDataSourceManager } from '@midwayjs/mongoose';
export declare function registerModel({ filePath, container, dataSourceManager, }: {
    container: IMidwayContainer;
    filePath: string;
    dataSourceManager: MongooseDataSourceManager;
}): Promise<void>;
