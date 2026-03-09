import { Inject, Provide } from '@midwayjs/core';
import { FilterQuery, Model } from 'mongoose';

import {
  RedisCacheClient,
  SwapTokenQueryCacheKeyParams,
} from '../../cache/redis';
import { SwapTokenModelProjection } from '../../constant';
import { PaginationDTO } from '../common/common.dto';
import { TokenCreateDTO, TokenQueryDTO, TokenUpdateDTO } from './token.dto';

import { Token, TokenSchemaName } from './token.entity';

// token 查询缓存过期时间
const TOKEN_QUERY_REDIS_CACHE_TTL_SECONDS = 10 * 60;
// token 对象缓存过期时间
const TOKEN_OBJECT_REDIS_CACHE_TTL_SECONDS = 6 * 60 * 60;

@Provide()
export class TokenService {
  @Inject(TokenSchemaName)
  tokenModel: Model<Token>;

  @Inject()
  redisCacheClient: RedisCacheClient;

  async createToken(token: TokenCreateDTO) {
    const provider = this.normalizeLowercase(token.provider);
    const chainCode = this.normalizeLowercase(token.chainCode);
    const address = this.normalizeLowercase(token.address);

    await this.tokenModel.create({
      ...token,
      provider,
      chainCode,
      address,
    });

    const created = await this.getTokenDetail(provider, chainCode, address);
    if (created) {
      await this.setTokenObjectCache(created);
    }
    await this.invalidateTokensCacheByPairs([{ provider, chainCode }]);
    return created;
  }

  // 批量创建 Token：
  // 1) 对 provider/chainCode/address 做标准化并按联合键去重
  // 2) 使用 bulkWrite + upsert 批量插入（仅插入不存在的数据）
  // 3) 按 Cache-Aside 失效 Token 缓存（provider 维度 + all 维度）
  async createTokenBatch(tokens: TokenCreateDTO[]) {
    const deduped = new Map<string, TokenCreateDTO>();

    for (const token of tokens || []) {
      const provider = this.normalizeLowercase(token.provider);
      const chainCode = this.normalizeLowercase(token.chainCode);
      const address = this.normalizeLowercase(token.address);
      if (!provider || !chainCode || !address) {
        continue;
      }

      deduped.set(`${provider}:${chainCode}:${address}`, {
        ...token,
        provider,
        chainCode,
        address,
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
          address: payload.address,
        },
        update: {
          $setOnInsert: payload,
        },
        upsert: true,
      },
    }));

    await this.tokenModel.bulkWrite(operations, { ordered: false });
    const result = await this.tokenModel.find(
      {
        $or: payloads.map(payload => ({
          provider: payload.provider,
          chainCode: payload.chainCode,
          address: payload.address,
        })),
      },
      SwapTokenModelProjection
    );

    await this.setTokenObjectCaches(result);
    await this.invalidateTokensCacheByPairs(
      payloads.map(payload => ({
        provider: payload.provider,
        chainCode: payload.chainCode,
      }))
    );

    return result;
  }

  // 查询 Token：
  // 1) 使用 buildListFilter 构建查询过滤条件
  // 2) 按 Cache-Aside 获取 Token 查询结果缓存
  // 3) 从 DB 查询 Token 列表并缓存
  // 4) 返回 Token 列表及下一页游标
  async findTokens(query: TokenQueryDTO, pagination: PaginationDTO) {
    const limitNum = Number(pagination.limit);
    const limit = Number.isNaN(limitNum) ? 10 : limitNum;
    const filters = this.buildListFilter(query, pagination);

    const result = await this.tokenModel.find(filters, SwapTokenModelProjection, {
      limit,
      sort: { createdAt: -1 },
    });

    const latestItem =
      result.length && result.length === limit
        ? result[result.length - 1]
        : null;
    const nextCursor = latestItem ? String((latestItem as any)._id || '') : '';

    return {
      result,
      next: nextCursor || null,
    };
  }

  // 分页查询 Token：
  async findTokensByPage(
    query: TokenQueryDTO,
    pagination: { page: number; pageSize: number }
  ) {
    const pageNum = Number(pagination.page);
    const page = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const pageSizeNum = Number(pagination.pageSize);
    const pageSize =
      Number.isNaN(pageSizeNum) || pageSizeNum < 1 ? 20 : pageSizeNum;
    const filters = this.buildListFilter(query, {});
    const cacheKeyParams = this.buildTokenQueryCacheParams(
      query,
      page,
      pageSize
    );

    if (cacheKeyParams) {
      const cachedResult = await this.getTokenQueryCache(cacheKeyParams);
      if (cachedResult) {
        const cachedTokens = await this.getTokensByIDs(cachedResult.ids);
        if (cachedTokens.length === cachedResult.ids.length) {
          return {
            result: cachedTokens,
            total: cachedResult.total,
          };
        }
      }
    }

    const pageResult = await this.queryTokenPageFromDB(filters, page, pageSize);
    await this.setTokenObjectCaches(pageResult.result);
    if (cacheKeyParams && pageResult.ids.length === pageResult.result.length) {
      await this.setTokenQueryCache(
        cacheKeyParams,
        pageResult.ids,
        pageResult.total
      );
    }

    return {
      result: pageResult.result,
      total: pageResult.total,
    };
  }

  async countTokens(query: TokenQueryDTO): Promise<number> {
    const filters = this.buildListFilter(query, {});
    return this.tokenModel.countDocuments(filters);
  }

  async getLatestSyncedAt(query: TokenQueryDTO): Promise<Date | null> {
    const filters = this.buildListFilter(query, {});
    const latest = await this.tokenModel.findOne(filters, ['syncedAt'], {
      sort: { syncedAt: -1 },
    });
    return latest?.syncedAt || null;
  }

  async findTokensByChainAndAddresses(
    chainCode: string,
    addresses: string[],
    isActive?: boolean
  ): Promise<Token[]> {
    const normalizedChainCode = this.normalizeLowercase(chainCode);
    const normalizedAddresses = Array.from(
      new Set(
        (addresses || [])
          .map(address => this.normalizeLowercase(address))
          .filter(Boolean)
      )
    );
    if (!normalizedChainCode || normalizedAddresses.length <= 0) {
      return [];
    }

    const filters: FilterQuery<Token> = {
      chainCode: normalizedChainCode,
      address: { $in: normalizedAddresses },
    };
    if (typeof isActive === 'boolean') {
      filters.isActive = isActive;
    }

    return this.tokenModel.find(filters, SwapTokenModelProjection);
  }

  async getTokenDetail(provider: string, chainCode: string, address: string) {
    return this.tokenModel.findOne(
      {
        provider: this.normalizeLowercase(provider),
        chainCode: this.normalizeLowercase(chainCode),
        address: this.normalizeLowercase(address),
      },
      SwapTokenModelProjection
    );
  }

  async updateToken(
    provider: string,
    chainCode: string,
    address: string,
    patch: TokenUpdateDTO
  ) {
    const normalizedProvider = this.normalizeLowercase(provider);
    const normalizedChainCode = this.normalizeLowercase(chainCode);
    const normalizedAddress = this.normalizeLowercase(address);
    const existing = await this.getTokenDetail(
      normalizedProvider,
      normalizedChainCode,
      normalizedAddress
    );

    const payload = { ...patch } as Partial<Token>;
    delete payload.provider;
    delete payload.chainCode;
    delete payload.address;
    delete payload.createdAt;
    delete payload.updatedAt;

    await this.tokenModel.updateOne(
      {
        provider: normalizedProvider,
        chainCode: normalizedChainCode,
        address: normalizedAddress,
      },
      payload,
      {
        runValidators: true,
      }
    );

    if (existing?.id) {
      await this.delTokenObjectCache(existing.id);
    }
    const updated = await this.getTokenDetail(
      normalizedProvider,
      normalizedChainCode,
      normalizedAddress
    );
    if (updated) {
      await this.setTokenObjectCache(updated);
    }
    await this.invalidateTokensCacheByPairs([
      { provider: normalizedProvider, chainCode: normalizedChainCode },
    ]);

    return true;
  }

  async deleteToken(provider: string, chainCode: string, address: string) {
    const normalizedProvider = this.normalizeLowercase(provider);
    const normalizedChainCode = this.normalizeLowercase(chainCode);
    const normalizedAddress = this.normalizeLowercase(address);
    const existing = await this.getTokenDetail(
      normalizedProvider,
      normalizedChainCode,
      normalizedAddress
    );

    await this.tokenModel.deleteOne({
      provider: normalizedProvider,
      chainCode: normalizedChainCode,
      address: normalizedAddress,
    });

    if (existing?.id) {
      await this.delTokenObjectCache(existing.id);
    }
    await this.invalidateTokensCacheByPairs([
      { provider: normalizedProvider, chainCode: normalizedChainCode },
    ]);

    return true;
  }

  private buildListFilter(
    query: TokenQueryDTO,
    pagination: PaginationDTO
  ): FilterQuery<Token> {
    const filter: FilterQuery<Token> = {};

    if (pagination.cursor) {
      filter._id = { $lt: pagination.cursor };
    }
    if (query.provider) {
      filter.provider = this.normalizeLowercase(query.provider);
    }
    if (query.chainCode) {
      filter.chainCode = this.normalizeLowercase(query.chainCode);
    }
    if (query.address) {
      filter.address = this.normalizeLowercase(query.address);
    }
    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }
    if (query.keyword) {
      const keywordRegex = new RegExp(
        this.escapeRegex(query.keyword.trim()),
        'i'
      );
      filter.$or = [
        { symbol: keywordRegex },
        { name: keywordRegex },
        { address: keywordRegex },
      ];
    }

    return filter;
  }

  private normalizeLowercase(input?: string): string {
    return String(input || '')
      .trim()
      .toLowerCase();
  }

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildTokenQueryCacheParams(
    query: TokenQueryDTO,
    page: number,
    pageSize: number
  ): SwapTokenQueryCacheKeyParams | null {
    const chainCode = this.normalizeLowercase(query.chainCode);
    if (!chainCode) {
      return null;
    }

    return {
      chainCode,
      provider: query.provider
        ? this.normalizeLowercase(query.provider)
        : undefined,
      keyword: query.keyword ? String(query.keyword).trim() : undefined,
      isActive:
        typeof query.isActive === 'boolean'
          ? Boolean(query.isActive)
          : undefined,
      page,
      pageSize,
    };
  }

  private async queryTokenPageFromDB(
    filters: FilterQuery<Token>,
    page: number,
    pageSize: number
  ): Promise<{ result: Token[]; total: number; ids: string[] }> {
    const skip = (page - 1) * pageSize;
    const [total, result] = await Promise.all([
      this.tokenModel.countDocuments(filters),
      this.tokenModel.find(filters, SwapTokenModelProjection, {
        skip,
        limit: pageSize,
        sort: { createdAt: -1 },
      }),
    ]);

    const ids = (result || [])
      .map(token => String(token?.id || '').trim())
      .filter(Boolean);

    return { result, total, ids };
  }

  private async setTokenObjectCaches(tokens: Token[]): Promise<void> {
    if (!Array.isArray(tokens) || tokens.length <= 0) {
      return;
    }

    await Promise.all(tokens.map(token => this.setTokenObjectCache(token)));
  }

  private async setTokenObjectCache(token: Token): Promise<void> {
    if (!this.redisCacheClient || !token?.id) {
      return;
    }

    try {
      // 随机过期时间 + 0到10 分钟左右
      const ttlSeconds =
        TOKEN_OBJECT_REDIS_CACHE_TTL_SECONDS + Math.floor(Math.random() * 600);
      await this.redisCacheClient.setSwapTokenObject(
        token.id,
        token,
        ttlSeconds
      );
    } catch (error) {
      console.warn('[swap.token.service] set token object cache failed', error);
    }
  }

  private async delTokenObjectCache(tokenID?: string): Promise<void> {
    if (!this.redisCacheClient || !tokenID) {
      return;
    }

    try {
      await this.redisCacheClient.delSwapTokenObject(tokenID);
    } catch (error) {
      console.warn(
        '[swap.token.service] delete token object cache failed',
        error
      );
    }
  }

  private async getTokenQueryCache(
    params: SwapTokenQueryCacheKeyParams
  ): Promise<{ ids: string[]; total: number } | null> {
    if (!this.redisCacheClient) {
      return null;
    }

    try {
      const cached = await this.redisCacheClient.getSwapTokenQueryResult(
        params
      );
      if (!cached || !Array.isArray(cached.ids)) {
        return null;
      }
      return {
        ids: cached.ids.map(id => String(id || '').trim()).filter(Boolean),
        total: Number(cached.total) || 0,
      };
    } catch (error) {
      console.warn('[swap.token.service] get token query cache failed', error);
      return null;
    }
  }

  private async setTokenQueryCache(
    params: SwapTokenQueryCacheKeyParams,
    ids: string[],
    total: number
  ): Promise<void> {
    if (!this.redisCacheClient) {
      return;
    }

    try {
      await this.redisCacheClient.setSwapTokenQueryResult(
        params,
        {
          ids,
          total,
        },
        TOKEN_QUERY_REDIS_CACHE_TTL_SECONDS
      );
    } catch (error) {
      console.warn('[swap.token.service] set token query cache failed', error);
    }
  }

  private async getTokensByIDs(ids: string[]): Promise<Token[]> {
    const normalizedIDs = (ids || [])
      .map(id => String(id || '').trim())
      .filter(Boolean);
    if (normalizedIDs.length <= 0) {
      return [];
    }

    const tokenMap = new Map<string, Token>();
    const missedIDs: string[] = [];

    if (this.redisCacheClient) {
      try {
        const cached = await this.redisCacheClient.mgetSwapTokenObjects<Token>(
          normalizedIDs
        );
        for (const id of normalizedIDs) {
          const item = cached.get(id);
          if (item && this.isTokenRecordComplete(item)) {
            tokenMap.set(id, item);
            continue;
          }
          missedIDs.push(id);
        }
      } catch (error) {
        console.warn(
          '[swap.token.service] get token object cache failed',
          error
        );
        missedIDs.push(...normalizedIDs);
      }
    } else {
      missedIDs.push(...normalizedIDs);
    }

    if (missedIDs.length > 0) {
      const dbRecords = await this.tokenModel.find(
        { id: { $in: missedIDs } },
        SwapTokenModelProjection
      );

      for (const record of dbRecords || []) {
        const tokenID = String(record.id || '').trim();
        if (!tokenID) {
          continue;
        }
        tokenMap.set(tokenID, record);
      }

      await this.setTokenObjectCaches(dbRecords);
    }

    return normalizedIDs
      .map(id => tokenMap.get(id))
      .filter((item): item is Token => Boolean(item));
  }

  private async invalidateTokensCacheByPairs(
    pairs: Array<{ provider: string; chainCode: string }>
  ) {
    if (!this.redisCacheClient) {
      return;
    }

    const dedupedPairs = Array.from(
      new Set(
        (pairs || []).map(
          pair =>
            `${this.normalizeLowercase(
              pair.chainCode
            )}:${this.normalizeLowercase(pair.provider)}`
        )
      )
    )
      .map(pair => {
        const [chainCode, provider] = pair.split(':');
        return { chainCode, provider };
      })
      .filter(pair => pair.chainCode && pair.provider);

    const targetPairs = Array.from(
      new Set(
        dedupedPairs.flatMap(pair => [
          `${pair.chainCode}:all`,
          `${pair.chainCode}:${pair.provider}`,
        ])
      )
    );

    try {
      await Promise.all(
        targetPairs.map(item => {
          const [chainCode, provider] = item.split(':');
          return this.redisCacheClient.delSwapTokenQueries(
            chainCode,
            provider === 'all' ? undefined : provider
          );
        })
      );
    } catch (error) {
      console.warn(
        '[swap.token.service] invalidate tokens cache failed',
        error
      );
    }
  }

  private isTokenRecordComplete(token: Token): boolean {
    return Boolean(
      String(token?.provider || '').trim() &&
        String(token?.chainCode || '').trim() &&
        String(token?.address || '').trim() &&
        String(token?.symbol || '').trim()
    );
  }
}
