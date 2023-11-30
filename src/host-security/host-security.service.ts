import { ErrorCode, GoPlus } from '@goplus/sdk-node';
import { Init, Inject, Logger, Provide } from '@midwayjs/core';
import { IMidwayLogger } from '@midwayjs/logger';
import { SoftDeleteModel } from 'mongoose-delete';

import { customConfig } from '../config/config.custom';
import {
  GoplusAccessTokenTTL,
  GoplusHostSecurityDappTTL,
  GoplusHostSecurityUrlTTL,
} from '../constant';
import {
  getGoplusAccessTokenCacheKey,
  getGoplusHostDappSecurityCacheKey,
  getGoplusHostUrlSecurityCacheKey,
  isObjectEmpty,
} from '../utils';

import { HostSecuritySchemaName, IHostSecurity } from './host-security.entity';
import { ICheckHostReturn } from './types';
import {
  IGoplusHostDappSecurity,
  IGoplusHostUrlSecurity,
  IGoplusPhishingSiteResponse,
} from './types/cache';

import type { CacheManager } from '@midwayjs/cache';

@Provide()
export class HostSecurityService {
  @Inject()
  cacheManager: CacheManager;

  @Logger()
  logger: IMidwayLogger;

  private goPlus = GoPlus;

  @Inject(HostSecuritySchemaName)
  private hostSecurityModel: SoftDeleteModel<IHostSecurity>;

  @Init()
  init() {
    const appKey = customConfig.goplus.appKey;
    const appSecret = customConfig.goplus.appSecret;
    this.goPlus.config(appKey, appSecret);
  }

  async refreshAccessToken(): Promise<void> {
    try {
      if (!(await this.cacheManager.get(getGoplusAccessTokenCacheKey()))) {
        const res = await GoPlus.getAccessToken();

        if (res.code !== ErrorCode.SUCCESS) {
          this.logger.error(res.message);
        }

        await this.cacheManager.set(getGoplusAccessTokenCacheKey(), 'value', {
          ttl: GoplusAccessTokenTTL,
        });
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async checkHost(url: string): Promise<ICheckHostReturn> {
    const host = url.includes('/') ? new URL(url).hostname : url;
    const result = {};

    await this.refreshAccessToken();

    // get data from database
    const hostSecurity = await this.hostSecurityModel.findOne({
      host,
    });

    const hostUrlSecurity = await this.getGoplusHostUrlSecurityInfo(
      host,
      hostSecurity
    );

    if (hostUrlSecurity.isBlackList || hostUrlSecurity.isWhiteList) {
      return {
        isBlackList: hostUrlSecurity.isBlackList,
        isWhiteList: hostUrlSecurity.isWhiteList,
      };
    }

    Object.assign(result, {
      phishingInfo: hostUrlSecurity?.phishingInfo,
    });

    const hostDappSecurity = await this.getGoplusHostDappSecurityInfo(
      host,
      hostSecurity
    );

    Object.assign(result, {
      dappSecurityInfo: hostDappSecurity.dappSecurityInfo,
    });

    return result;
  }

  async getGoplusHostUrlSecurityInfo(
    host: string,
    hostSecurity: IHostSecurity
  ): Promise<IGoplusHostUrlSecurity> {
    try {
      const cachedUrl: IGoplusHostUrlSecurity = JSON.parse(
        (await this.cacheManager.get(getGoplusHostUrlSecurityCacheKey(host))) ??
          '{}'
      );

      const result: IGoplusHostUrlSecurity = {};

      if (!isObjectEmpty(cachedUrl)) {
        if (cachedUrl.isBlackList || cachedUrl.isWhiteList) {
          return {
            isBlackList: cachedUrl.isBlackList,
            isWhiteList: cachedUrl.isWhiteList,
          };
        }

        Object.assign(result, {
          phishingInfo: cachedUrl.phishingInfo || '',
        });
      } else {
        if (hostSecurity?.isBlackList || hostSecurity?.isWhiteList) {
          return {
            isBlackList: hostSecurity.isBlackList,
            isWhiteList: hostSecurity.isWhiteList,
          };
        }
        const data = await this.goPlus.phishingSite(host);

        if (data.code !== ErrorCode.SUCCESS) {
          // api error
          this.logger.error(data.message);

          Object.assign(result, {
            phishingInfo: hostSecurity?.goplusInfo?.phishingInfo || {},
          });
        } else {
          const fetchHostUrlSecurity: IGoplusPhishingSiteResponse = data.result;

          Object.assign(result, {
            phishingInfo: fetchHostUrlSecurity || {},
          });

          // save to database
          this.hostSecurityModel
            .findOneAndUpdate(
              {
                host,
              },
              {
                goplusInfo: {
                  phishingInfo: fetchHostUrlSecurity || {},
                },
              },
              {
                upsert: true,
              }
            )
            .exec();
        }

        await this.cacheManager.set(
          getGoplusHostUrlSecurityCacheKey(host),
          JSON.stringify({
            ...result,
            isBlackList: hostSecurity?.isBlackList,
            isWhiteList: hostSecurity?.isWhiteList,
          }),
          {
            ttl: GoplusHostSecurityUrlTTL,
          }
        );
      }

      return result;
    } catch {
      this.logger.error('getHostUrlSecurityInfo error');
      return {
        phishingInfo: {},
      };
    }
  }

  async getGoplusHostDappSecurityInfo(
    host: string,
    hostSecurity: IHostSecurity
  ): Promise<IGoplusHostDappSecurity> {
    try {
      const cachedDapp: IGoplusHostDappSecurity = JSON.parse(
        (await this.cacheManager.get(
          getGoplusHostDappSecurityCacheKey(host)
        )) || '{}'
      );

      const result = {};

      if (!isObjectEmpty(cachedDapp)) {
        Object.assign(result, {
          dappSecurityInfo: cachedDapp.dappSecurityInfo,
        });
      } else {
        const data = await this.goPlus.dappSecurity(host);

        if (data.code !== ErrorCode.SUCCESS) {
          // api error
          this.logger.error(data.message);

          Object.assign(result, {
            dappSecurityInfo: hostSecurity?.goplusInfo?.dappSecurityInfo || {},
          });
        } else {
          const fetchHostDappSecurity = data.result;

          // save to database
          this.hostSecurityModel
            .findOneAndUpdate(
              {
                host,
              },
              {
                goplusInfo: {
                  dappSecurityInfo: fetchHostDappSecurity || {},
                },
              },
              {
                upsert: true,
              }
            )
            .exec();

          Object.assign(result, {
            dappSecurityInfo: fetchHostDappSecurity || {},
          });
        }

        await this.cacheManager.set(
          getGoplusHostDappSecurityCacheKey(host),
          JSON.stringify(result),
          {
            ttl: GoplusHostSecurityDappTTL,
          }
        );
      }

      return result;
    } catch (err) {
      this.logger.error(err);
      return {
        dappSecurityInfo: {},
      };
    }
  }
}
