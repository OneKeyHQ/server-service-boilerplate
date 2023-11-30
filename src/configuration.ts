import {
  App,
  Config,
  Configuration,
  IMidwayContainer,
  Inject,
  MidwayLoggerService,
} from '@midwayjs/core';
import * as crossDomain from '@midwayjs/cross-domain';
import * as i18n from '@midwayjs/i18n';
import * as koa from '@midwayjs/koa';
import * as mongoose from '@midwayjs/mongoose';
import * as redis from '@midwayjs/redis';
import * as swagger from '@midwayjs/swagger';
import * as validate from '@midwayjs/validate';

import * as DefaultConfig from './config/config.default';
import { DefaultErrorFilter } from './filter/error.filter';
import { NotFoundFilter } from './filter/notfound.filter';
import { ResponseWraperMiddleware } from './middleware/response-wrapper';
import { registerModel } from './utils/register-model';

@Configuration({
  namespace: 'service-base',
  imports: [
    koa,
    validate,
    mongoose,
    i18n,
    redis,
    {
      component: crossDomain,
      enabledEnvironment: ['local'],
    },
    {
      component: swagger,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [
    {
      default: DefaultConfig,
    },
  ],
})
export class ServiceBaseConfiguration {
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

    await registerModel({
      container: applicationContext,
      dataSourceManager: this.dataSourceManager,
      filePath: this.app.getBaseDir(),
    });
  }
}
