import { createHash } from 'crypto';

import { Inject, Provide } from '@midwayjs/core';
import { RedisService } from '@midwayjs/redis';

import { Network } from '../thirdparty/swap/provider.interface';

const CACHE_KEY_NS = 'swap';

function normalizeKeySegment(value: string | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function encodeKeySegment(value: string | undefined): string {
  const normalized = normalizeKeySegment(value);
  return encodeURIComponent(normalized || 'all');
}

function hashKeySegment(value: string | undefined): string {
  const normalized = normalizeKeySegment(value);
  if (!normalized) {
    return 'none';
  }
  return createHash('sha1').update(normalized).digest('hex');
}

export interface SwapTokenQueryCacheKeyParams {
  chainCode: string;
  provider?: string;
  keyword?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

export interface SwapTokenQueryCachePayload {
  ids: string[];
  total: number;
  updatedAt: number;
}

export const SwapRedisKey = {
  networks(provider?: string) {
    return `${CACHE_KEY_NS}:networks:${encodeKeySegment(provider)}`;
  },
  tokenObject(id: string) {
    return `${CACHE_KEY_NS}:token:${encodeURIComponent(
      String(id || '').trim()
    )}`;
  },
  tokenQuery(params: SwapTokenQueryCacheKeyParams) {
    const isActiveSegment =
      typeof params.isActive === 'boolean' ? String(params.isActive) : 'all';
    const page = Number.isFinite(Number(params.page)) ? Number(params.page) : 1;
    const pageSize = Number.isFinite(Number(params.pageSize))
      ? Number(params.pageSize)
      : 20;
    return `${CACHE_KEY_NS}:token:query:${encodeKeySegment(
      params.chainCode
    )}:${encodeKeySegment(params.provider)}:${encodeKeySegment(
      isActiveSegment
    )}:${page}:${pageSize}:${hashKeySegment(params.keyword)}`;
  },
  tokenQueryPrefix(chainCode: string, provider?: string) {
    return `${CACHE_KEY_NS}:token:query:${encodeKeySegment(
      chainCode
    )}:${encodeKeySegment(provider)}:`;
  },
};

export interface CacheEnvelope<T> {
  data: T;
  updatedAt: number;
}

@Provide()
export class RedisCacheClient {
  @Inject()
  redisService: RedisService;

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redisService.set(key, payload, 'EX', ttlSeconds);
      return;
    }
    await this.redisService.set(key, payload);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const payload = await this.redisService.get(key);
    if (!payload) {
      return null;
    }

    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  }

  async del(key: string): Promise<number> {
    return this.redisService.del(key);
  }

  async setSwapNetworks(
    provider: string | undefined,
    networks: Network[],
    ttlSeconds: number
  ) {
    const key = SwapRedisKey.networks(provider);
    const payload: CacheEnvelope<Network[]> = {
      data: networks,
      updatedAt: Date.now(),
    };
    await this.setJSON(key, payload, ttlSeconds);
    return key;
  }

  async getSwapNetworks(
    provider?: string
  ): Promise<CacheEnvelope<Network[]> | null> {
    return this.getJSON<CacheEnvelope<Network[]>>(
      SwapRedisKey.networks(provider)
    );
  }

  async delSwapNetworks(provider?: string): Promise<number> {
    return this.del(SwapRedisKey.networks(provider));
  }

  async setSwapTokenObject<T>(id: string, token: T, ttlSeconds: number) {
    const key = SwapRedisKey.tokenObject(id);
    await this.setJSON(key, token, ttlSeconds);
    return key;
  }

  async getSwapTokenObject<T>(id: string): Promise<T | null> {
    return this.getJSON<T>(SwapRedisKey.tokenObject(id));
  }

  async mgetSwapTokenObjects<T>(ids: string[]): Promise<Map<string, T>> {
    const map = new Map<string, T>();
    const normalizedIDs = (ids || [])
      .map(id => String(id || '').trim())
      .filter(Boolean);
    if (normalizedIDs.length <= 0) {
      return map;
    }

    const keys = normalizedIDs.map(id => SwapRedisKey.tokenObject(id));
    const values = await (this.redisService as any).mget(...keys);
    if (!Array.isArray(values)) {
      return map;
    }

    for (let i = 0; i < normalizedIDs.length; i += 1) {
      const payload = values[i];
      if (!payload) {
        continue;
      }
      try {
        map.set(normalizedIDs[i], JSON.parse(payload) as T);
      } catch {
        continue;
      }
    }

    return map;
  }

  async delSwapTokenObject(id: string): Promise<number> {
    return this.del(SwapRedisKey.tokenObject(id));
  }

  async setSwapTokenQueryResult(
    params: SwapTokenQueryCacheKeyParams,
    payload: { ids: string[]; total: number },
    ttlSeconds: number
  ) {
    const key = SwapRedisKey.tokenQuery(params);
    const value: SwapTokenQueryCachePayload = {
      ids: payload.ids || [],
      total: Number(payload.total) || 0,
      updatedAt: Date.now(),
    };
    await this.setJSON(key, value, ttlSeconds);
    return key;
  }

  async getSwapTokenQueryResult(
    params: SwapTokenQueryCacheKeyParams
  ): Promise<SwapTokenQueryCachePayload | null> {
    return this.getJSON<SwapTokenQueryCachePayload>(
      SwapRedisKey.tokenQuery(params)
    );
  }

  async delSwapTokenQueries(
    chainCode: string,
    provider?: string
  ): Promise<number> {
    const pattern = `${SwapRedisKey.tokenQueryPrefix(chainCode, provider)}*`;
    return this.delByPattern(pattern);
  }

  private async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    do {
      const reply = await (this.redisService as any).scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        200
      );
      if (!Array.isArray(reply) || reply.length < 2) {
        break;
      }

      cursor = String(reply[0] || '0');
      const keys = Array.isArray(reply[1]) ? reply[1] : [];
      if (keys.length > 0) {
        deleted += await (this.redisService as any).del(...keys);
      }
    } while (cursor !== '0');

    return deleted;
  }
}
