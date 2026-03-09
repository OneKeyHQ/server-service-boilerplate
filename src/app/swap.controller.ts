import { PassThrough } from 'stream';

import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { Rule, RuleType } from '@midwayjs/validate';
import { NetworkService } from '../entity/networks/networks.service';
import { buildUnsignedTx as buildChainUnsignedTx } from '../chain/indexer';
import { TokenService } from '../entity/token/token.service';
import { ProviderManager } from '../thirdparty/swap/provider-manager';
import { UnsignedTx } from '../chain/indexer';
import { ResParamsError, ResInternalServerError } from '../base/reply';
import {
  BuildTxResult,
  QuoteAcrossProvidersResult,
  QuoteRequest,
  QuoteResult,
  Network,
  Token,
} from '../thirdparty/swap/provider.interface';

class SwapNetworksQuery {
  // 渠道标识（可选）；不传时返回所有支持渠道的网络
  @Rule(RuleType.string())
  provider?: string;

  // 是否强制刷新（可选，默认 false）；true 时跳过 Redis 缓存读取
  @Rule(RuleType.boolean())
  refresh?: boolean;
}

interface NetworkGroupItem {
  chainCode: string;
  chainId?: string;
  nativeTokenAddress: string;
  chainName?: string;
  isActive: boolean;
  syncedAt?: Date;
}

interface NetworksGroupedResponse {
  networksByProvider: Record<string, NetworkGroupItem[]>;
  meta: {
    providerCount: number;
    networkCount: number;
  };
}

// 获取 Token 列表的查询参数
class SwapTokensQuery {
  // 渠道标识（可选）；不传时查询该网络下所有渠道
  @Rule(RuleType.string())
  provider?: string;

  // 网络/链编码（必填），例如 eth、bsc、solana
  @Rule(RuleType.string().required())
  chainCode: string;

  // 搜索关键词（可选），匹配 symbol/name/address
  @Rule(RuleType.string())
  keyword?: string;

  // 页码（可选，默认 1）
  @Rule(RuleType.number().integer().min(1))
  page?: number;

  // 每页数量（可选，默认 20，最大 200）
  @Rule(RuleType.number().integer().min(1).max(200))
  pageSize?: number;

  // 是否强制刷新（可选，默认 false）；true 时直接查 provider
  @Rule(RuleType.boolean())
  refresh?: boolean;
}

// 获取 Token 列表接口返回结构
interface TokenListItem {
  chainCode: string;
  address: string;
  symbol: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
  isActive: boolean;
  providers: string[];
  raw?: Record<string, unknown>;
  syncedAt?: Date;
}

interface SwapTokensResponse {
  list: TokenListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// 多渠道询价请求参数（providers 为空时由服务端自动决策）
class SwapQuoteBaseRequest implements QuoteRequest {
  // 网络/链编码（必填）
  @Rule(RuleType.string().required())
  chainCode: string;

  // 输入代币地址（必填）
  @Rule(RuleType.string().required())
  inTokenAddress: string;

  // 输出代币地址（必填）
  @Rule(RuleType.string().required())
  outTokenAddress: string;

  // 输入数量（最小单位，必填）
  @Rule(RuleType.string().required())
  amountDecimals: string;

  // 滑点（可选）
  @Rule(RuleType.number().min(0))
  slippage?: number;

  // 用户钱包地址（可选）
  @Rule(RuleType.string())
  account?: string;

  // gas price（最小单位，必填）
  @Rule(RuleType.string().required())
  gasPriceDecimals: string;

  // 允许使用的 DEX ID 列表（可选，逗号分隔）
  @Rule(RuleType.string())
  enabledDexIds?: string;

  // 禁止使用的 DEX ID 列表（可选，逗号分隔）
  @Rule(RuleType.string())
  disabledDexIds?: string;
}

class SwapQuotesRequest extends SwapQuoteBaseRequest {
  // 渠道列表（必填，至少 1 个）
  @Rule(RuleType.array().items(RuleType.string().required()).min(1).required())
  providers: string[];
}

// 多渠道询价返回结构（包含最佳报价与失败渠道）
interface SwapQuotesResponse extends QuoteAcrossProvidersResult {
  bestQuote?: QuoteResult;
  deadlineMs?: number;
}

// 单渠道询价查询参数
class SwapQuoteQuery extends SwapQuoteBaseRequest {
  // 渠道标识（必填）
  @Rule(RuleType.string().required())
  provider: string;
}

// 构建交易请求参数
class SwapBuildTxRequest {
  // 网络/链编码（必填）
  @Rule(RuleType.string().required())
  chainCode: string;

  // 输入代币地址（必填）
  @Rule(RuleType.string().required())
  inTokenAddress: string;

  // 输出代币地址（必填）
  @Rule(RuleType.string().required())
  outTokenAddress: string;

  // 输入数量（最小单位，必填）
  @Rule(RuleType.string().required())
  amountDecimals: string;

  // gas price（最小单位，必填）
  @Rule(RuleType.string().required())
  gasPriceDecimals: string;

  // 用户钱包地址（必填）
  @Rule(RuleType.string().required())
  account: string;

  // 滑点（可选）
  @Rule(RuleType.number().min(0))
  slippage?: number;

  // 允许使用的 DEX ID 列表（可选，逗号分隔）
  @Rule(RuleType.string())
  enabledDexIds?: string;

  // 禁止使用的 DEX ID 列表（可选，逗号分隔）
  @Rule(RuleType.string())
  disabledDexIds?: string;

  // 渠道标识（可选，不传时使用默认渠道）
  @Rule(RuleType.string())
  provider?: string;

  // 接收地址（可选）
  @Rule(RuleType.string())
  receiver?: string;

  // 返佣地址（可选）
  @Rule(RuleType.string())
  referrer?: string;
}

// 构建交易的完整响应
interface SwapBuildTxResponse extends BuildTxResult {
  /**
   * 链级别的未签名交易对象，由 buildChainUnsignedTx 生成，
   * 包含 nonce、gasLimit 等链上参数，客户端可直接用于签名。
   */
  unsignedTx: UnsignedTx;
}
class SwapQuotesPollQuery extends SwapQuoteBaseRequest {
  // 渠道列表（至少 1 个）
  @Rule(RuleType.array().items(RuleType.string().required()).min(1).required())
  providers: string[];

  // 轮询间隔（秒，范围 3-60，默认 5）
  @Rule(RuleType.number().integer().min(3).max(60))
  interval?: number;
}

const POLL_INTERVAL_DEFAULT_S = 5;
const POLL_INTERVAL_MIN_S = 3;
const POLL_INTERVAL_MAX_S = 60;

const SUPPORTED_PROVIDERS: string[] = ['openocean'];
const DEFAULT_PROVIDER = SUPPORTED_PROVIDERS[0] || 'openocean';
const NETWORK_CACHE_LIMIT = 500;
const NETWORK_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const TOKEN_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_TOKENS_PAGE = 1;
const DEFAULT_TOKENS_PAGE_SIZE = 20;
const MAX_TOKENS_PAGE_SIZE = 200;

@Controller('/swap')
export class SwapController {
  @Inject()
  providerManager: ProviderManager;

  @Inject()
  networkService: NetworkService;

  @Inject()
  tokenService: TokenService;

  @Inject()
  ctx: Context;

  // 获取支持网络列表
  @Get('/networks')
  async getNetworks(
    @Query() query: SwapNetworksQuery
  ): Promise<NetworksGroupedResponse> {
    const provider = String(query.provider || '')
      .trim()
      .toLowerCase();
    const refresh = this.resolveRefresh(query.refresh);
    if (provider) {
      this.ensureSupportedProvider(provider);
    }

    if (!refresh) {
      const cachedNetworks = await this.networkService.getNetworksCache(
        provider || undefined
      );
      if (cachedNetworks && cachedNetworks.length > 0) {
        return this.buildGroupedNetworksResponse(cachedNetworks, provider);
      }
    }

    let networks: Network[] = [];
    if (provider) {
      networks = await this.getNetworksByProvider(provider);
      await this.networkService.setNetworksCache(provider, networks);
      return this.buildGroupedNetworksResponse(networks, provider);
    }

    const allProviders = this.resolveSupportedProviders();
    const networkGroups = await Promise.all(
      allProviders.map(item => this.getNetworksByProvider(item))
    );
    networks = networkGroups.flat();
    await this.networkService.setNetworksCache(undefined, networks);
    return this.buildGroupedNetworksResponse(networks);
  }

  // 获取指定链的 Token 列表
  @Get('/tokens')
  async getTokens(
    @Query() query: SwapTokensQuery
  ): Promise<SwapTokensResponse> {
    const chainCode = this.normalizeChainCode(query.chainCode);
    const provider = String(query.provider || '')
      .trim()
      .toLowerCase();
    const keyword = this.normalizeKeyword(query.keyword);
    const page = this.resolvePage(query.page);
    const pageSize = this.resolvePageSize(query.pageSize);
    const refresh = this.resolveRefresh(query.refresh);

    if (provider) {
      this.ensureSupportedProvider(provider);
    }

    if (refresh) {
      const fetchedTokens = await this.fetchTokensDirectly(provider, chainCode);
      const filteredTokens = this.filterTokensByKeyword(fetchedTokens, keyword);
      const groupedTokens = this.groupTokensByAddress(filteredTokens);
      const { list, total } = this.paginateItems(groupedTokens, page, pageSize);
      return {
        list,
        pagination: {
          page,
          pageSize,
          total,
        },
      };
    }

    await this.ensureTokenCache(provider, chainCode);

    const tokenQuery = {
      chainCode,
      provider: provider || undefined,
      keyword,
      isActive: true,
    };
    const tokenPage = await this.tokenService.findTokensByPage(tokenQuery, {
      page,
      pageSize,
    });
    console.log('tokenPage', JSON.stringify(tokenPage, null, 2));
    const groupedTokens = this.groupTokensByAddress(
      (tokenPage.result || []).map(token => this.mapTokenEntity(token))
    );
    if (!provider && groupedTokens.length > 0) {
      const allProviderRecords =
        await this.tokenService.findTokensByChainAndAddresses(
          chainCode,
          groupedTokens.map(token => token.address),
          true
        );
      this.applyProviderCoverage(
        groupedTokens,
        (allProviderRecords || []).map(item => this.mapTokenEntity(item))
      );
    }

    return {
      list: groupedTokens,
      pagination: {
        page,
        pageSize,
        total: tokenPage.total || 0,
      },
    };
  }

  // 单渠道询价
  @Get('/quote')
  async quote(@Query() query: SwapQuoteQuery): Promise<QuoteResult> {
    const provider = String(query.provider || '')
      .trim()
      .toLowerCase();
    if (!provider) {
      throw ResParamsError('provider is required');
    }
    this.ensureSupportedProvider(provider);
    this.ensureRequiredQuoteFields(
      query.amountDecimals,
      query.gasPriceDecimals
    );

    return this.providerManager.quote(provider, {
      chainCode: this.normalizeChainCode(query.chainCode),
      inTokenAddress: query.inTokenAddress,
      outTokenAddress: query.outTokenAddress,
      amountDecimals: query.amountDecimals,
      slippage: query.slippage,
      account: query.account,
      gasPriceDecimals: query.gasPriceDecimals,
      enabledDexIds: query.enabledDexIds,
      disabledDexIds: query.disabledDexIds,
    });
  }

  // 多渠道并发询价
  @Post('/quotes')
  async quoteAcrossProviders(
    @Body() body: SwapQuotesRequest
  ): Promise<SwapQuotesResponse> {
    const providers = this.normalizeProviders(body.providers);
    if (providers.length <= 0) {
      throw ResParamsError('providers is required');
    }
    for (const provider of providers) {
      this.ensureSupportedProvider(provider);
    }
    this.ensureRequiredQuoteFields(body.amountDecimals, body.gasPriceDecimals);

    const result = await this.providerManager.quoteAcrossProviders(providers, {
      chainCode: this.normalizeChainCode(body.chainCode),
      inTokenAddress: body.inTokenAddress,
      outTokenAddress: body.outTokenAddress,
      amountDecimals: body.amountDecimals,
      slippage: body.slippage,
      account: body.account,
      gasPriceDecimals: body.gasPriceDecimals,
      enabledDexIds: body.enabledDexIds,
      disabledDexIds: body.disabledDexIds,
    });

    return {
      ...result,
      bestQuote: this.pickBestQuote(result.quotes),
    };
  }

  // 多渠道轮询询价（SSE）
  // 连接后立即执行首轮，之后每隔 interval 秒重新询价，每个渠道结果到达时立刻推送
  // 客户端断开连接时自动停止轮询
  @Post('/quotes/poll')
  async quotePoll(@Body() body: SwapQuotesPollQuery): Promise<void> {
    const providers = this.normalizeProviders(body.providers);
    if (providers.length <= 0) {
      throw ResParamsError('providers is required');
    }
    for (const provider of providers) {
      this.ensureSupportedProvider(provider);
    }
    this.ensureRequiredQuoteFields(body.amountDecimals, body.gasPriceDecimals);

    const intervalMs =
      Math.max(
        POLL_INTERVAL_MIN_S,
        Math.min(POLL_INTERVAL_MAX_S, Number(body.interval || POLL_INTERVAL_DEFAULT_S))
      ) * 1000;

    const request: QuoteRequest = {
      chainCode: this.normalizeChainCode(body.chainCode),
      inTokenAddress: body.inTokenAddress,
      outTokenAddress: body.outTokenAddress,
      amountDecimals: body.amountDecimals,
      slippage: body.slippage,
      account: body.account,
      gasPriceDecimals: body.gasPriceDecimals,
      enabledDexIds: body.enabledDexIds,
      disabledDexIds: body.disabledDexIds,
    };

    const ctx = this.ctx;
    ctx.set('Content-Type', 'text/event-stream');
    ctx.set('Cache-Control', 'no-cache');
    ctx.set('Connection', 'keep-alive');
    ctx.status = 200;

    const stream = new PassThrough();
    ctx.body = stream;

    const write = (event: string, data: unknown) => {
      if (!stream.destroyed) {
        stream.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    let round = 0;
    let isPolling = false;

    const runRound = async () => {
      if (isPolling || stream.destroyed) return;
      isPolling = true;
      round += 1;
      const currentRound = round;
      const collectedQuotes: QuoteResult[] = [];

      await Promise.all(
        providers.map(async provider => {
          try {
            const quote = await this.providerManager.quote(provider, request);
            collectedQuotes.push(quote);
            write('quote', { round: currentRound, provider, status: 'success', quote, ts: Date.now() });
          } catch (err) {
            const providerErr = err as { code?: string; message?: string };
            write('quote', {
              round: currentRound,
              provider,
              status: 'error',
              error: { code: providerErr.code ?? 'UNKNOWN', message: String(providerErr.message ?? err) },
              ts: Date.now(),
            });
          }
        })
      );

      write('round_done', {
        round: currentRound,
        bestQuote: this.pickBestQuote(collectedQuotes),
        successCount: collectedQuotes.length,
        failCount: providers.length - collectedQuotes.length,
        ts: Date.now(),
      });

      isPolling = false;
    };

    // 立即执行第一轮
    runRound();
    const timer = setInterval(runRound, intervalMs);

    ctx.req.on('close', () => {
      clearInterval(timer);
      stream.destroy();
    });
  }

  // 构建兑换交易（不广播）
  @Post('/tx/build')
  async buildTx(
    @Body() body: SwapBuildTxRequest
  ): Promise<SwapBuildTxResponse> {
    const provider = this.normalizeProvider(body.provider);
    this.ensureSupportedProvider(provider);
    const chainCode = this.normalizeChainCode(body.chainCode);
    this.ensureRequiredBuildTxFields(
      body.amountDecimals,
      body.gasPriceDecimals,
      body.account
    );

    const providerResult = await this.providerManager.buildTx(provider, {
      chainCode,
      inTokenAddress: body.inTokenAddress,
      outTokenAddress: body.outTokenAddress,
      amountDecimals: body.amountDecimals,
      slippage: body.slippage,
      account: body.account,
      gasPriceDecimals: body.gasPriceDecimals,
      enabledDexIds: body.enabledDexIds,
      disabledDexIds: body.disabledDexIds,
      receiver: body.receiver,
      referrer: body.referrer,
    });

    let unsignedTx: UnsignedTx;
    try {
      unsignedTx = await buildChainUnsignedTx(
        chainCode,
        providerResult.tx.to,
        body.account,
        providerResult.tx.data || '',
        providerResult.tx.value || '0',
        12000
      );
    } catch (error) {
      const reason = this.extractBuildTxErrorMessage(error);
      throw ResInternalServerError(`build unsigned tx failed: ${reason}`);
    }

    return {
      ...providerResult,
      unsignedTx: unsignedTx,
    };
  }

  private normalizeProvider(provider?: string): string {
    return String(provider || DEFAULT_PROVIDER)
      .trim()
      .toLowerCase();
  }

  private normalizeChainCode(chainCode?: string): string {
    return String(chainCode || '')
      .trim()
      .toLowerCase();
  }

  private normalizeKeyword(keyword?: string): string | undefined {
    const value = String(keyword || '').trim();
    return value || undefined;
  }

  private resolveRefresh(refresh?: unknown): boolean {
    if (typeof refresh === 'boolean') {
      return refresh;
    }
    const normalized = String(refresh || '')
      .trim()
      .toLowerCase();
    return normalized === 'true' || normalized === '1';
  }

  private normalizeProviders(providers?: string[]): string[] {
    const list = Array.isArray(providers) ? providers : [];
    const normalized = list
      .map(provider =>
        String(provider || '')
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);
    return Array.from(new Set(normalized));
  }

  private resolvePage(page?: number): number {
    const pageNum = Number(page);
    if (Number.isFinite(pageNum) && pageNum >= 1) {
      return Math.floor(pageNum);
    }
    return DEFAULT_TOKENS_PAGE;
  }

  private resolvePageSize(pageSize?: number): number {
    const pageSizeNum = Number(pageSize);
    if (!Number.isFinite(pageSizeNum) || pageSizeNum < 1) {
      return DEFAULT_TOKENS_PAGE_SIZE;
    }
    return Math.min(Math.floor(pageSizeNum), MAX_TOKENS_PAGE_SIZE);
  }

  private ensureSupportedProvider(provider: string) {
    const supported = this.resolveSupportedProviders();
    if (supported.includes(provider)) {
      return;
    }

    throw ResParamsError(`unsupported provider: ${provider}`);
  }

  private extractBuildTxErrorMessage(error: unknown): string {
    const maybeError = error as {
      reason?: unknown;
      shortMessage?: unknown;
      message?: unknown;
    };
    const reason = String(maybeError?.reason || '').trim();
    if (reason) {
      return reason;
    }
    const shortMessage = String(maybeError?.shortMessage || '').trim();
    if (shortMessage) {
      return shortMessage;
    }
    const message = String(maybeError?.message || '').trim();
    if (message) {
      return message;
    }
    return 'unknown error';
  }

  private ensureRequiredQuoteFields(
    amountDecimals?: string,
    gasPriceDecimals?: string
  ): void {
    const normalizedAmountDecimals = String(amountDecimals || '').trim();
    const normalizedGasPriceDecimals = String(gasPriceDecimals || '').trim();
    if (!normalizedAmountDecimals || !normalizedGasPriceDecimals) {
      throw ResParamsError('amountDecimals and gasPriceDecimals are required');
    }
  }

  private ensureRequiredBuildTxFields(
    amountDecimals?: string,
    gasPriceDecimals?: string,
    account?: string
  ): void {
    const normalizedAmountDecimals = String(amountDecimals || '').trim();
    const normalizedGasPriceDecimals = String(gasPriceDecimals || '').trim();
    const normalizedAccount = String(account || '').trim();
    if (
      !normalizedAmountDecimals ||
      !normalizedGasPriceDecimals ||
      !normalizedAccount
    ) {
      throw ResParamsError(
        'amountDecimals, gasPriceDecimals and account are required'
      );
    }
  }

  private resolveSupportedProviders(): string[] {
    const dynamicSupportedProviders =
      this.providerManager?.getSupportedProviders?.() || [];
    const mergedProviders = Array.from(
      new Set(
        [...SUPPORTED_PROVIDERS, ...dynamicSupportedProviders]
          .map(provider => this.normalizeProvider(provider))
          .filter(Boolean)
      )
    );
    return mergedProviders.length > 0 ? mergedProviders : [DEFAULT_PROVIDER];
  }

  private isNetworkCacheExpired(networks: Network[]): boolean {
    let latestSyncedAt = 0;
    for (const network of networks) {
      const syncedAtMs = new Date(network.syncedAt || 0).getTime();
      if (Number.isFinite(syncedAtMs) && syncedAtMs > latestSyncedAt) {
        latestSyncedAt = syncedAtMs;
      }
    }

    if (!latestSyncedAt) {
      return true;
    }
    return Date.now() - latestSyncedAt > NETWORK_CACHE_TTL_MS;
  }

  private async syncNetworkCache(provider: string, networks: Network[]) {
    const now = new Date();
    const pendingCreates: Array<{
      provider: string;
      chainCode: string;
      chainName: string;
      chainId: string;
      nativeTokenAddress: string;
      isActive: boolean;
      metadata?: Record<string, unknown>;
      syncedAt: Date;
    }> = [];

    for (const network of networks || []) {
      const chainCode = String(network.chainCode || '')
        .trim()
        .toLowerCase();
      if (!chainCode) {
        continue;
      }

      const upsertPayload = {
        chainName: String(network.chainName || chainCode),
        chainId: String(network.chainId || ''),
        nativeTokenAddress: String(network.nativeTokenAddress || ''),
        isActive: network.isActive !== false,
        syncedAt: network.syncedAt || now,
      };

      const existingNetwork = await this.networkService.getNetworkDetail(
        provider,
        chainCode
      );
      if (existingNetwork) {
        await this.networkService.updateNetwork(
          provider,
          chainCode,
          upsertPayload
        );
        continue;
      }

      pendingCreates.push({
        provider,
        chainCode,
        ...upsertPayload,
      });
    }

    if (pendingCreates.length > 0) {
      await this.networkService.createNetworksBatch(pendingCreates);
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    const code = Number((error as { code?: unknown } | undefined)?.code);
    return code === 11000;
  }

  private pickBestQuote(quotes: QuoteResult[]): QuoteResult | undefined {
    let bestQuote: QuoteResult | undefined;
    for (const quote of quotes || []) {
      if (!bestQuote) {
        bestQuote = quote;
        continue;
      }
      if (this.compareAmount(quote.outAmount, bestQuote.outAmount) > 0) {
        bestQuote = quote;
      }
    }
    return bestQuote;
  }

  private compareAmount(left: string, right: string): number {
    try {
      const leftAmount = BigInt(String(left || '0'));
      const rightAmount = BigInt(String(right || '0'));
      if (leftAmount > rightAmount) {
        return 1;
      }
      if (leftAmount < rightAmount) {
        return -1;
      }
      return 0;
    } catch {
      const leftNumber = Number(left);
      const rightNumber = Number(right);
      if (leftNumber > rightNumber) {
        return 1;
      }
      if (leftNumber < rightNumber) {
        return -1;
      }
      return 0;
    }
  }

  private async fetchTokensDirectly(
    provider: string,
    chainCode: string
  ): Promise<Token[]> {
    if (provider) {
      const tokens = await this.providerManager.getTokenList(
        provider,
        chainCode
      );
      return tokens || [];
    }

    const providers = this.resolveSupportedProviders();
    const tokenGroups = await Promise.all(
      providers.map(item => this.providerManager.getTokenList(item, chainCode))
    );
    return tokenGroups.flat().filter(Boolean);
  }

  private filterTokensByKeyword(tokens: Token[], keyword?: string): Token[] {
    if (!keyword) {
      return tokens || [];
    }
    const normalizedKeyword = keyword.toLowerCase();
    return (tokens || []).filter(token => {
      const symbol = String(token.symbol || '').toLowerCase();
      const name = String(token.name || '').toLowerCase();
      const address = String(token.address || '').toLowerCase();
      return (
        symbol.includes(normalizedKeyword) ||
        name.includes(normalizedKeyword) ||
        address.includes(normalizedKeyword)
      );
    });
  }

  private paginateItems<T>(
    items: T[],
    page: number,
    pageSize: number
  ): { list: T[]; total: number } {
    const total = (items || []).length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      list: (items || []).slice(start, end),
      total,
    };
  }

  private groupTokensByAddress(tokens: Token[]): TokenListItem[] {
    const grouped = new Map<string, TokenListItem>();
    const providerSets = new Map<string, Set<string>>();

    for (const token of tokens || []) {
      const chainCode = this.normalizeChainCode(token.chainCode);
      const address = String(token.address || '')
        .trim()
        .toLowerCase();
      if (!chainCode || !address) {
        continue;
      }

      const key = `${chainCode}:${address}`;
      const provider = this.normalizeProvider(token.provider);
      const syncedAtTime = new Date(token.syncedAt || 0).getTime();
      const current = grouped.get(key);

      if (!current) {
        grouped.set(key, {
          chainCode,
          address,
          symbol: String(token.symbol || '').trim(),
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI,
          isActive: token.isActive !== false,
          providers: [],
          raw: this.normalizeMetadata(token.raw),
          syncedAt: token.syncedAt,
        });
      } else {
        const currentSyncedAtTime = new Date(current.syncedAt || 0).getTime();
        if (
          Number.isFinite(syncedAtTime) &&
          syncedAtTime > 0 &&
          (!Number.isFinite(currentSyncedAtTime) ||
            syncedAtTime > currentSyncedAtTime)
        ) {
          current.syncedAt = token.syncedAt;
        }
        current.isActive = current.isActive || token.isActive !== false;
      }

      if (!providerSets.has(key)) {
        providerSets.set(key, new Set<string>());
      }
      if (provider) {
        providerSets.get(key)!.add(provider);
      }
    }

    for (const [key, providers] of providerSets.entries()) {
      const item = grouped.get(key);
      if (!item) {
        continue;
      }
      item.providers = Array.from(providers).sort();
    }

    return Array.from(grouped.values());
  }

  private applyProviderCoverage(
    groupedTokens: TokenListItem[],
    allProviderRecords: Token[]
  ): void {
    if (!groupedTokens.length || !allProviderRecords.length) {
      return;
    }

    const coverageMap = new Map<string, string[]>();
    const groupedCoverage = this.groupTokensByAddress(allProviderRecords);
    for (const token of groupedCoverage) {
      coverageMap.set(`${token.chainCode}:${token.address}`, token.providers);
    }

    for (const item of groupedTokens) {
      const key = `${this.normalizeChainCode(item.chainCode)}:${String(
        item.address || ''
      )
        .trim()
        .toLowerCase()}`;
      const providers = coverageMap.get(key);
      if (providers && providers.length > 0) {
        item.providers = providers;
      }
    }
  }

  private async ensureTokenCache(provider: string, chainCode: string) {
    if (provider) {
      const needSync = await this.shouldSyncTokenCache(provider, chainCode);
      if (needSync) {
        await this.syncTokenCache(provider, chainCode);
      }
      return;
    }

    const providers = this.resolveSupportedProviders();
    await Promise.all(
      providers.map(async item => {
        const needSync = await this.shouldSyncTokenCache(item, chainCode);
        if (needSync) {
          await this.syncTokenCache(item, chainCode);
        }
      })
    );
  }

  private async shouldSyncTokenCache(
    provider: string,
    chainCode: string
  ): Promise<boolean> {
    const tokenCount = await this.tokenService.countTokens({
      provider,
      chainCode,
      isActive: true,
    });
    if (tokenCount <= 0) {
      return true;
    }

    const latestSyncedAt = await this.tokenService.getLatestSyncedAt({
      provider,
      chainCode,
      isActive: true,
    });
    if (!latestSyncedAt) {
      return true;
    }

    const latestSyncedAtMs = new Date(latestSyncedAt).getTime();
    if (!Number.isFinite(latestSyncedAtMs) || latestSyncedAtMs <= 0) {
      return true;
    }

    return Date.now() - latestSyncedAtMs > TOKEN_CACHE_TTL_MS;
  }

  private async syncTokenCache(provider: string, chainCode: string) {
    const fetchedTokens = await this.providerManager.getTokenList(
      provider,
      chainCode
    );
    const now = new Date();

    for (const token of fetchedTokens || []) {
      const address = String(token.address || '')
        .trim()
        .toLowerCase();
      if (!address) {
        continue;
      }

      const upsertPayload = {
        symbol: String(token.symbol || '').trim(),
        name: String(token.name || '').trim() || undefined,
        decimals: token.decimals,
        logoURI: String(token.logoURI || '').trim() || undefined,
        isActive: token.isActive !== false,
        raw: this.normalizeMetadata(token.raw),
        syncedAt: token.syncedAt || now,
      };
      if (!upsertPayload.symbol) {
        continue;
      }

      const existingToken = await this.tokenService.getTokenDetail(
        provider,
        chainCode,
        address
      );
      if (existingToken) {
        await this.tokenService.updateToken(
          provider,
          chainCode,
          address,
          upsertPayload
        );
        continue;
      }

      try {
        await this.tokenService.createToken({
          provider,
          chainCode,
          address,
          ...upsertPayload,
        });
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }
        await this.tokenService.updateToken(
          provider,
          chainCode,
          address,
          upsertPayload
        );
      }
    }
  }

  private async getNetworksByProvider(provider: string): Promise<Network[]> {
    const cached = await this.networkService.findNetworks(
      {
        provider,
        isActive: true,
      },
      {
        limit: NETWORK_CACHE_LIMIT,
      }
    );
    const cachedNetworks = (cached.result || []).map(network =>
      this.mapNetworkEntity(network)
    );
    if (
      cachedNetworks.length > 0 &&
      !this.isNetworkCacheExpired(cachedNetworks)
    ) {
      return cachedNetworks;
    }

    const fetchedNetworks = await this.providerManager.getNetworks(provider);
    await this.syncNetworkCache(provider, fetchedNetworks);
    return fetchedNetworks;
  }

  private normalizeMetadata(raw?: Record<string, unknown>) {
    if (!raw || typeof raw !== 'object') {
      return undefined;
    }
    return raw;
  }

  private mapNetworkEntity(network: Network): Network {
    return {
      provider: String(network.provider || DEFAULT_PROVIDER),
      chainCode: String(network.chainCode || ''),
      chainId: String(network.chainId || ''),
      nativeTokenAddress: String(network.nativeTokenAddress || ''),
      chainName: String(network.chainName || ''),
      isActive: Boolean(network.isActive),
      syncedAt: network.syncedAt,
    };
  }

  private buildGroupedNetworksResponse(
    networks: Network[],
    provider?: string
  ): NetworksGroupedResponse {
    const grouped: Record<string, NetworkGroupItem[]> = {};
    for (const network of networks || []) {
      const normalizedProvider = this.normalizeProvider(network.provider);
      if (!grouped[normalizedProvider]) {
        grouped[normalizedProvider] = [];
      }
      grouped[normalizedProvider].push({
        chainCode: String(network.chainCode || ''),
        chainId: String(network.chainId || ''),
        nativeTokenAddress: String(network.nativeTokenAddress || ''),
        chainName: String(network.chainName || ''),
        isActive: network.isActive !== false,
        syncedAt: network.syncedAt,
      });
    }

    const targetProvider = this.normalizeProvider(provider || '');
    if (provider && !grouped[targetProvider]) {
      grouped[targetProvider] = [];
    }

    const providerCount = Object.keys(grouped).length;
    const networkCount = Object.values(grouped).reduce(
      (count, list) => count + list.length,
      0
    );

    return {
      networksByProvider: grouped,
      meta: {
        providerCount,
        networkCount,
      },
    };
  }

  private mapTokenEntity(token: Token): Token {
    return {
      provider: String(token.provider || DEFAULT_PROVIDER),
      chainCode: String(token.chainCode || ''),
      address: String(token.address || ''),
      symbol: String(token.symbol || ''),
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI,
      isActive: Boolean(token.isActive),
      raw: this.normalizeMetadata(token.raw),
      syncedAt: token.syncedAt,
    };
  }
}
