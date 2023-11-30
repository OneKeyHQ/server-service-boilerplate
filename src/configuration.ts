import { hostname } from 'os';
import { join } from 'path';

import * as cache from '@midwayjs/cache';
import {
  App,
  Config,
  Configuration,
  IMidwayContainer,
  Inject,
  MidwayLoggerService,
} from '@midwayjs/core';
import * as crossDomain from '@midwayjs/cross-domain';
import * as grpc from '@midwayjs/grpc';
import * as i18n from '@midwayjs/i18n';
import * as koa from '@midwayjs/koa';
import { IMidwayLogger } from '@midwayjs/logger';
import * as mongoose from '@midwayjs/mongoose';
import * as redis from '@midwayjs/redis';
import * as swagger from '@midwayjs/swagger';
import * as validate from '@midwayjs/validate';
import { sync } from 'read-pkg';

import { DefaultErrorFilter } from './filter/default.filter';
import { NotFoundFilter } from './filter/notfound.filter';
import { ResponseWraperMiddleware } from './middleware/response-wraper.middleware';
import { CloudwatchTransport } from './utils/logger';
import { registerModel } from './utils/rigister-model';

@Configuration({
  imports: [
    // bull,
    koa,
    validate,
    mongoose,
    i18n,
    redis,
    cache,
    grpc,
    {
      component: crossDomain,
      enabledEnvironment: ['local'],
    },
    {
      component: swagger,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  @Config('env')
  envConfig: string;

  @Config('aws')
  awsConfig: {
    awsAccessKeyId: string;
    awsSecretKey: string;
    awsRegion: string;
  };

  @Inject()
  loggerService: MidwayLoggerService;

  @Inject()
  dataSourceManager: mongoose.MongooseDataSourceManager;

  async onReady(applicationContext: IMidwayContainer) {
    this.app.useMiddleware([ResponseWraperMiddleware]);
    this.app.useFilter([DefaultErrorFilter, NotFoundFilter]);

    if (this.envConfig === 'production') {
      const cloudwatchTransport = new CloudwatchTransport({
        app: this.app.getProjectName(),
        hostname: hostname(),
        version: sync().version,
        awsAccessKeyId: this.awsConfig.awsAccessKeyId,
        awsSecretKey: this.awsConfig.awsSecretKey,
        awsRegion: this.awsConfig.awsRegion,
      });

      const appLogger = this.loggerService.getLogger(
        'appLogger'
      ) as IMidwayLogger;
      appLogger.add(cloudwatchTransport);
      const coreLogger = this.loggerService.getLogger(
        'coreLogger'
      ) as IMidwayLogger;
      coreLogger.add(cloudwatchTransport);
    }

    const connection = this.dataSourceManager.getDataSource('default');
    await registerModel(applicationContext, connection, __dirname);
  }
}
