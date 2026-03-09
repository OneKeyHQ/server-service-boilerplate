import { Inject, Provide } from '@midwayjs/core';
import { FilterQuery, Model } from 'mongoose';

import { RedisCacheClient } from '../../cache/redis';
import { SwapNetworkModelProjection } from '../../constant';
import { Network as ProviderNetwork } from '../../thirdparty/swap/provider.interface';
import { PaginationDTO } from '../common/common.dto';
import {
  NetworkCreateDTO,
  NetworkQueryDTO,
  NetworkUpdateDTO,
} from './networks.dto';

import { Network, NetworkSchemaName } from './networks.entity';

const NETWORK_REDIS_CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

@Provide()
export class NetworkService {
  @Inject(NetworkSchemaName)
  networkModel: Model<Network>;

  @Inject()
  redisCacheClient: RedisCacheClient;

  // 批量创建网络：
  // 1) 对 provider/chainCode 做标准化并按联合键去重
  // 2) 使用 bulkWrite + upsert 批量插入（仅插入不存在的数据）
  // 3) 按 Cache-Aside 失效网络缓存（provider 维度 + all 维度）
  async createNetworksBatch(networks: NetworkCreateDTO[]) {
    const deduped = new Map<string, NetworkCreateDTO>();

    for (const network of networks || []) {
      const provider = this.normalizeLowercase(network.provider);
      const chainCode = this.normalizeLowercase(network.chainCode);
      if (!provider || !chainCode) {
        continue;
      }

      deduped.set(`${provider}:${chainCode}`, {
        ...network,
        provider,
        chainCode,
      });
    }

    const payloads = Array.from(deduped.values());
    if (payloads.length <= 0) {
      return [];
    }

    const operations = payloads.map(payload => ({
      updateOne: {
        filter: {
          provider: payload.provider,
          chainCode: payload.chainCode,
        },
        update: {
          $setOnInsert: payload,
        },
        upsert: true,
      },
    }));

    await this.networkModel.bulkWrite(operations, { ordered: false });
    await this.invalidateNetworksCacheByProviders(
      payloads.map(payload => payload.provider)
    );

    return this.networkModel.find(
      {
        $or: payloads.map(payload => ({
          provider: payload.provider,
          chainCode: payload.chainCode,
        })),
      },
      SwapNetworkModelProjection
    );
  }

  // 分页查询网络列表：
  // 1) 按 query 构建过滤条件（provider/chainCode/chainId/isActive）
  // 2) 按 createdAt 倒序返回当前页数据
  // 3) 当结果数量等于 limit 时返回 next 游标（最后一条记录 id）
  async findNetworks(query: NetworkQueryDTO, pagination: PaginationDTO) {
    const limitNum = Number(pagination.limit);
    const limit = Number.isNaN(limitNum) ? 10 : limitNum;
    const filters = this.buildListFilter(query, pagination);

    const result = await this.networkModel.find(filters, SwapNetworkModelProjection, {
      limit,
      sort: { createdAt: -1 },
    });

    const latestItem =
      result.length && result.length === limit
        ? result[result.length - 1]
        : null;

    return {
      result,
      next: latestItem?.id ?? null,
    };
  }

  async getNetworkDetail(provider: string, chainCode: string) {
    return this.networkModel.findOne(
      {
        provider: this.normalizeLowercase(provider),
        chainCode: this.normalizeLowercase(chainCode),
      },
      SwapNetworkModelProjection
    );
  }

  async updateNetwork(
    provider: string,
    chainCode: string,
    patch: NetworkUpdateDTO
  ) {
    const payload = { ...patch } as Partial<Network>;
    delete payload.provider;
    delete payload.chainCode;
    delete payload.createdAt;
    delete payload.updatedAt;

    await this.networkModel.updateOne(
      {
        provider: this.normalizeLowercase(provider),
        chainCode: this.normalizeLowercase(chainCode),
      },
      payload,
      {
        runValidators: true,
      }
    );

    return true;
  }

  async deleteNetwork(provider: string, chainCode: string) {
    await this.networkModel.deleteOne({
      provider: this.normalizeLowercase(provider),
      chainCode: this.normalizeLowercase(chainCode),
    });
    return true;
  }

  async getNetworksCache(provider?: string): Promise<ProviderNetwork[] | null> {
    if (!this.redisCacheClient) {
      return null;
    }

    try {
      const cached = await this.redisCacheClient.getSwapNetworks(provider);
      if (!cached || !Array.isArray(cached.data)) {
        return null;
      }
      return cached.data;
    } catch (error) {
      console.warn('[swap.network.service] get networks cache failed', error);
      return null;
    }
  }

  async setNetworksCache(
    provider: string | undefined,
    networks: ProviderNetwork[]
  ): Promise<void> {
    if (!this.redisCacheClient || !Array.isArray(networks)) {
      return;
    }

    try {
      await this.redisCacheClient.setSwapNetworks(
        provider,
        networks,
        NETWORK_REDIS_CACHE_TTL_SECONDS
      );
    } catch (error) {
      console.warn('[swap.network.service] set networks cache failed', error);
    }
  }

  private buildListFilter(
    query: NetworkQueryDTO,
    pagination: PaginationDTO
  ): FilterQuery<Network> {
    const filter: FilterQuery<Network> = {};

    if (pagination.cursor) {
      filter._id = { $lt: pagination.cursor };
    }
    if (query.provider) {
      filter.provider = this.normalizeLowercase(query.provider);
    }
    if (query.chainCode) {
      filter.chainCode = this.normalizeLowercase(query.chainCode);
    }
    if (query.chainId) {
      filter.chainId = String(query.chainId).trim();
    }
    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    return filter;
  }

  private normalizeLowercase(input?: string): string {
    return String(input || '')
      .trim()
      .toLowerCase();
  }

  private async invalidateNetworksCacheByProviders(providers: string[]) {
    if (!this.redisCacheClient) {
      return;
    }

    const normalizedProviders = Array.from(
      new Set(
        (providers || []).map(provider => this.normalizeLowercase(provider))
      )
    ).filter(Boolean);
    const targetProviders = [undefined, ...normalizedProviders];

    try {
      await Promise.all(
        targetProviders.map(provider =>
          this.redisCacheClient.delSwapNetworks(provider)
        )
      );
    } catch (error) {
      console.warn(
        '[swap.network.service] invalidate networks cache failed',
        error
      );
    }
  }
}
