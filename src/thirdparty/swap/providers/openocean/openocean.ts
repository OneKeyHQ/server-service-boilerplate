import { Provide } from '@midwayjs/core';

import {
  BuildTxRequest,
  BuildTxResult,
  ISwapProvider,
  OPENOCEAN_PROVIDER,
  QuoteRequest,
  QuoteResult,
  Network,
  Token,
} from '../../provider.interface';
import { SwapProviderError } from '../../provider.errors';

interface OpenOceanAdapterOptions {
  baseUrl?: string;
  timeoutMs?: number;
  retryTimes?: number;
  retryDelayMs?: number;
  fetcher?: FetchLike;
  log?: LogLike;
  metric?: MetricLike;
}

interface FetchRequestInitLike {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface FetchResponseLike {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
}

type FetchLike = (
  url: string,
  init?: FetchRequestInitLike
) => Promise<FetchResponseLike>;

type LogLike = Pick<Console, 'info' | 'warn' | 'error'>;

type MetricLike = (
  name: string,
  value: number,
  tags?: Record<string, string | number | boolean>
) => void;

const DEFAULT_BASE_URL = 'https://open-api.openocean.finance';
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRY_TIMES = 1;
const DEFAULT_RETRY_DELAY_MS = 80;

interface SupportedNetworkSeed {
  chainCode: string;
  chainId?: string;
  nativeTokenAddress?: string;
  chainName: string;
}

// Source: OpenOcean supported chains docs.
// This list is intentionally hardcoded because OpenOcean does not provide
// a stable public API endpoint for chain discovery.
const OPENOCEAN_SUPPORTED_NETWORKS: SupportedNetworkSeed[] = [
  {
    chainCode: 'eth',
    chainId: '1',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Ethereum',
  },
  {
    chainCode: 'bsc',
    chainId: '56',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'BNB Chain',
  },
  {
    chainCode: 'base',
    chainId: '8453',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Base',
  },
  {
    chainCode: 'polygon',
    chainId: '137',
    nativeTokenAddress: '0x0000000000000000000000000000000000001010',
    chainName: 'Polygon',
  },
  {
    chainCode: 'arbitrum',
    chainId: '42161',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Arbitrum',
  },
  {
    chainCode: 'linea',
    chainId: '59144',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Linea',
  },
  {
    chainCode: 'hyperevm',
    chainId: '999',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'HyperEVM',
  },
  {
    chainCode: 'avax',
    chainId: '43114',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Avalanche',
  },
  {
    chainCode: 'optimism',
    chainId: '10',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Optimism',
  },
  {
    chainCode: 'sonic',
    chainId: '146',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Sonic',
  },
  {
    chainCode: 'uni',
    chainId: '130',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'UniChain',
  },
  {
    chainCode: 'bera',
    chainId: '80094',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Berachain',
  },
  {
    chainCode: 'sei',
    chainId: '1329',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Sei',
  },
  {
    chainCode: 'plasma',
    chainId: '9745',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Plasma',
  },
  {
    chainCode: 'monad',
    chainId: '143',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Monad',
  },
  {
    chainCode: 'injective',
    chainId: '1776',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Injective',
  },
  {
    chainCode: 'zksync',
    chainId: '324',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'zkSync Era',
  },
  {
    chainCode: 'aurora',
    chainId: '1313161554',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Aurora',
  },
  {
    chainCode: 'cronos',
    chainId: '25',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Cronos',
  },
  {
    chainCode: 'harmony',
    chainId: '1666600000',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Harmony',
  },
  {
    chainCode: 'kava',
    chainId: '2222',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Kava',
  },
  {
    chainCode: 'metis',
    chainId: '1088',
    nativeTokenAddress: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
    chainName: 'Metis',
  },
  {
    chainCode: 'celo',
    chainId: '42220',
    nativeTokenAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    chainName: 'Celo',
  },
  {
    chainCode: 'telos',
    chainId: '40',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Telos',
  },
  {
    chainCode: 'polygon_zkevm',
    chainId: '1101',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Polygon zkEVM',
  },
  {
    chainCode: 'xdai',
    chainId: '100',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Gnosis',
  },
  {
    chainCode: 'opbnb',
    chainId: '204',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'opBNB',
  },
  {
    chainCode: 'mantle',
    chainId: '5000',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Mantle',
  },
  {
    chainCode: 'manta',
    chainId: '169',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Manta',
  },
  {
    chainCode: 'scroll',
    chainId: '534352',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Scroll',
  },
  {
    chainCode: 'blast',
    chainId: '81457',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Blast',
  },
  {
    chainCode: 'mode',
    chainId: '34443',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Mode',
  },
  {
    chainCode: 'rootstock',
    chainId: '30',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Rootstock',
  },
  {
    chainCode: 'gravity',
    chainId: '1625',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Gravity',
  },
  {
    chainCode: 'ape',
    chainId: '33139',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Apechain',
  },
  {
    chainCode: 'flare',
    chainId: '14',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Flare',
  },
  {
    chainCode: 'swell',
    chainId: '1923',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Swell',
  },
  {
    chainCode: 'plume',
    chainId: '98866',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Plume',
  },
  {
    chainCode: 'tac',
    chainId: '239',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'TAC',
  },
  {
    chainCode: 'moonriver',
    chainId: '1285',
    nativeTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainName: 'Moonriver',
  },
  {
    chainCode: 'fantom',
    chainId: '250',
    nativeTokenAddress: '0x0000000000000000000000000000000000000000',
    chainName: 'Fantom',
  },
  {
    chainCode: 'solana',
    chainId: '',
    nativeTokenAddress: 'So11111111111111111111111111111111111111112',
    chainName: 'Solana',
  },
  { chainCode: 'sui', chainId: '', nativeTokenAddress: '', chainName: 'Sui' },
];

@Provide()
export class OpenOceanAdapter implements ISwapProvider {
  provider = OPENOCEAN_PROVIDER;

  private readonly baseUrl: string;

  private readonly timeoutMs: number;

  private readonly retryTimes: number;

  private readonly retryDelayMs: number;

  private readonly fetcher: FetchLike | undefined;

  private readonly log: LogLike;

  private readonly metric: MetricLike;

  constructor(options: OpenOceanAdapterOptions = {}) {
    this.baseUrl =
      options.baseUrl || process.env.OPENOCEAN_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = Number(
      options.timeoutMs ??
        process.env.OPENOCEAN_TIMEOUT_MS ??
        DEFAULT_TIMEOUT_MS
    );
    this.retryTimes = Number(
      options.retryTimes ??
        process.env.OPENOCEAN_RETRY_TIMES ??
        DEFAULT_RETRY_TIMES
    );
    this.retryDelayMs = Number(
      options.retryDelayMs ??
        process.env.OPENOCEAN_RETRY_DELAY_MS ??
        DEFAULT_RETRY_DELAY_MS
    );
    this.fetcher =
      options.fetcher ??
      ((globalThis as { fetch?: FetchLike }).fetch as FetchLike | undefined);
    this.log = options.log || console;
    this.metric = options.metric || (() => null);
  }

  async getNetworks(): Promise<Network[]> {
    const supportedNetworks = OPENOCEAN_SUPPORTED_NETWORKS;
    const syncedAt = new Date();
    const result: Network[] = [];
    for (const item of supportedNetworks) {
      result.push({
        provider: this.provider,
        chainCode: item.chainCode,
        chainId: item.chainId || '',
        nativeTokenAddress: item.nativeTokenAddress || '',
        chainName: item.chainName,
        isActive: true,
        syncedAt,
      });
    }

    return result;
  }

  async getTokenList(chainCode: string): Promise<Token[]> {
    const mappedChain = this.resolveChainCode(chainCode);
    const responseData = await this.request<unknown[]>({
      apiName: 'tokenList',
      path: `/v4/${mappedChain}/tokenList`,
      provider: this.provider,
      chainCode: mappedChain,
    });

    const now = new Date();
    const result: Token[] = [];
    for (const item of this.asArray(responseData)) {
      const raw = this.asRecord(item);
      const address = this.pickString(raw, ['address']);
      const symbol = this.pickString(raw, ['symbol']);
      if (!address || !symbol) {
        continue;
      }

      result.push({
        provider: this.provider,
        chainCode: mappedChain,
        address: address.toLowerCase(),
        symbol,
        name: this.pickString(raw, ['name']),
        decimals: this.pickNumber(raw, ['decimals']),
        logoURI: this.pickString(raw, ['icon', 'logoURI', 'logo']),
        isActive: true,
        raw,
        syncedAt: now,
      });
    }

    return result;
  }

  async quote(request: QuoteRequest): Promise<QuoteResult> {
    const mappedChain = this.resolveChainCode(request.chainCode);
    this.validateQuoteRequest(request);
    const amountDecimals = this.resolveAmountDecimals(request);
    const gasPriceDecimals = this.resolveGasPriceDecimals(request);

    const responseData = await this.request<Record<string, unknown>>({
      apiName: 'quote',
      path: `/v4/${mappedChain}/quote`,
      query: {
        inTokenAddress: request.inTokenAddress,
        outTokenAddress: request.outTokenAddress,
        amountDecimals,
        slippage: request.slippage,
        account: request.account,
        gasPriceDecimals,
        enabledDexIds: request.enabledDexIds,
        disabledDexIds: request.disabledDexIds,
      },
      provider: this.provider,
      chainCode: mappedChain,
    });

    const outAmount = this.pickString(responseData, [
      'outAmount',
      'outTokenAmount',
      'toTokenAmount',
      'out',
    ]);
    if (!outAmount) {
      throw new SwapProviderError(
        'SWAP_QUOTE_EMPTY',
        'openocean quote response missing outAmount'
      );
    }

    return {
      provider: this.provider,
      chainCode: mappedChain,
      inAmount:
        this.pickString(responseData, [
          'inAmount',
          'inTokenAmount',
          'fromTokenAmount',
        ]) || amountDecimals,
      outAmount,
      minOutAmount: this.pickString(responseData, [
        'minOutAmount',
        'minAmountOut',
      ]),
      estimatedGas: this.pickString(responseData, [
        'estimatedGas',
        'estimatedGasAmount',
        'gas',
      ]),
      gasPrice: this.pickString(responseData, ['gasPrice']),
      route: responseData.path || responseData.route || responseData.dexes,
      raw: responseData,
    };
  }

  async buildTx(request: BuildTxRequest): Promise<BuildTxResult> {
    const mappedChain = this.resolveChainCode(request.chainCode);
    this.validateQuoteRequest(request);
    this.validateSwapRequest(request);
    const amountDecimals = this.resolveAmountDecimals(request);
    const gasPriceDecimals = this.resolveGasPriceDecimals(request);

    const responseData = await this.request<Record<string, unknown>>({
      apiName: 'swap',
      path: `/v4/${mappedChain}/swap`,
      query: {
        inTokenAddress: request.inTokenAddress,
        outTokenAddress: request.outTokenAddress,
        amountDecimals,
        slippage: request.slippage,
        account: request.account,
        receiver: request.receiver,
        referrer: request.referrer,
        gasPriceDecimals,
      },
      provider: this.provider,
      chainCode: mappedChain,
    });

    const txRecord = this.resolveTxPayload(responseData);
    const to = this.pickString(txRecord, ['to']);
    const data = this.pickString(txRecord, ['data']);
    if (!to || !data) {
      throw new SwapProviderError(
        'SWAP_BUILD_TX_FAILED',
        'openocean buildTx response missing tx.to or tx.data'
      );
    }

    return {
      provider: this.provider,
      chainCode: mappedChain,
      tx: {
        to,
        data,
        value: this.pickString(txRecord, ['value']) || '0',
        gasLimit: this.pickString(txRecord, ['gas', 'gasLimit']),
        gasPrice: this.pickString(txRecord, ['gasPrice']),
        chainId: this.pickString(txRecord, ['chainId']),
      },
    };
  }

  private async request<T>(options: {
    apiName: string;
    path: string;
    method?: 'GET' | 'POST';
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    provider?: string;
    chainCode?: string;
  }): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const method = options.method || 'GET';
    let lastError: unknown;
    let attempt = 0;

    while (attempt <= this.retryTimes) {
      attempt += 1;
      const startedAt = Date.now();
      this.log.info?.(
        `[swap.thirdparty.request] provider=${
          options.provider || this.provider
        } api=${options.apiName} chainCode=${
          options.chainCode || ''
        } attempt=${attempt} timeoutMs=${this.timeoutMs}`
      );

      try {
        const response = await this.fetchWithTimeout(url, {
          method,
          headers: {
            'content-type': 'application/json',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          const responseBody = await this.readResponseBody(response);
          const httpError = this.mapHttpError(
            response.status,
            responseBody,
            options.provider
          );
          throw httpError;
        }

        const responseBody = await response.json();
        const data = this.unwrapData(responseBody) as T;
        const payload = this.asRecord(data);
        if (this.isProviderBusinessError(payload)) {
          throw this.toProviderBusinessError(payload);
        }
        const latencyMs = Date.now() - startedAt;
        this.metric('swap_provider_latency_ms', latencyMs, {
          provider: options.provider || this.provider,
          apiName: options.apiName,
          status: 'success',
        });
        this.log.info?.(
          `[swap.thirdparty.response] provider=${
            options.provider || this.provider
          } api=${options.apiName} latencyMs=${latencyMs} status=success`
        );
        return data;
      } catch (error) {
        lastError = error;
        const providerError = this.toProviderError(error, options.provider);
        const shouldRetry =
          providerError.code === 'SWAP_PROVIDER_TIMEOUT' &&
          attempt <= this.retryTimes;
        const latencyMs = Date.now() - startedAt;

        this.metric('swap_provider_requests_total', 1, {
          provider: options.provider || this.provider,
          apiName: options.apiName,
          status: 'error',
          errorCode: providerError.code,
        });
        this.log.warn?.(
          `[swap.thirdparty.error] provider=${
            options.provider || this.provider
          } api=${
            options.apiName
          } latencyMs=${latencyMs} attempt=${attempt} retry=${shouldRetry} code=${
            providerError.code
          } message=${providerError.message}`
        );

        if (!shouldRetry) {
          throw providerError;
        }

        await this.wait(this.retryDelayMs * attempt);
      }
    }

    throw this.toProviderError(lastError, options.provider);
  }

  private async fetchWithTimeout(
    url: string,
    init: FetchRequestInitLike
  ): Promise<FetchResponseLike> {
    if (!this.fetcher) {
      throw new SwapProviderError(
        'SWAP_PROVIDER_UNAVAILABLE',
        'fetch API is unavailable in current runtime'
      );
    }

    const timeoutError = new SwapProviderError(
      'SWAP_PROVIDER_TIMEOUT',
      `openocean request timeout after ${this.timeoutMs}ms`
    );

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<FetchResponseLike>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(timeoutError), this.timeoutMs);
    });

    try {
      return await Promise.race([this.fetcher(url, init), timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === null || value === undefined || value === '') {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private validateQuoteRequest(request: QuoteRequest) {
    const amountDecimals = this.pickString(
      request as unknown as Record<string, unknown>,
      ['amountDecimals']
    );
    const gasPriceDecimals = this.pickString(
      request as unknown as Record<string, unknown>,
      ['gasPriceDecimals']
    );
    if (
      !request.chainCode ||
      !request.inTokenAddress ||
      !request.outTokenAddress ||
      !amountDecimals ||
      !gasPriceDecimals
    ) {
      throw new SwapProviderError(
        'SWAP_INVALID_PARAM',
        'missing required fields for openocean request: chainCode, inTokenAddress, outTokenAddress, amountDecimals, gasPriceDecimals'
      );
    }
  }

  private resolveChainCode(chainCode: string): string {
    const normalized = String(chainCode || '').trim();
    if (!normalized) {
      throw new SwapProviderError(
        'SWAP_INVALID_PARAM',
        'chainCode is required'
      );
    }
    return normalized;
  }

  private resolveAmountDecimals(request: QuoteRequest): string | undefined {
    return this.pickString(request as unknown as Record<string, unknown>, [
      'amountDecimals',
    ]);
  }

  private resolveGasPriceDecimals(request: QuoteRequest): string | undefined {
    return this.pickString(request as unknown as Record<string, unknown>, [
      'gasPriceDecimals',
    ]);
  }

  private validateSwapRequest(request: BuildTxRequest) {
    const account = this.pickString(
      request as unknown as Record<string, unknown>,
      ['account']
    );
    if (!account) {
      throw new SwapProviderError(
        'SWAP_INVALID_PARAM',
        'missing required fields for openocean swap request: account'
      );
    }
  }

  private unwrapData(responseBody: unknown): unknown {
    const raw = this.asRecord(responseBody);
    if (raw?.data !== undefined) {
      return raw.data;
    }
    return responseBody;
  }

  private async readResponseBody(response: FetchResponseLike): Promise<string> {
    try {
      if (response.text) {
        return await response.text();
      }
      return JSON.stringify(await response.json());
    } catch (error) {
      return `failed_to_read_response_body: ${String(error)}`;
    }
  }

  private mapHttpError(
    status: number,
    body: string,
    provider?: string
  ): SwapProviderError {
    if (status === 408 || status === 504) {
      return new SwapProviderError(
        'SWAP_PROVIDER_TIMEOUT',
        `provider timeout: ${body}`
      );
    }

    if (status >= 500 || status === 429) {
      return new SwapProviderError(
        'SWAP_PROVIDER_UNAVAILABLE',
        `provider unavailable(${status}): ${body}`
      );
    }

    return new SwapProviderError(
      'SWAP_INVALID_PARAM',
      `provider bad request(${status}): ${body}`
    );
  }

  private toProviderError(
    error: unknown,
    provider?: string
  ): SwapProviderError {
    if (error instanceof SwapProviderError) {
      return error;
    }
    return new SwapProviderError(
      'SWAP_PROVIDER_UNAVAILABLE',
      `provider request failed: ${String(error)}`
    );
  }

  private isProviderBusinessError(payload: Record<string, unknown>): boolean {
    if (!payload || Object.keys(payload).length <= 0) {
      return false;
    }

    const code = this.pickNumber(payload, ['code', 'status']);
    if (!Number.isFinite(code)) {
      return false;
    }

    return code !== 0 && code !== 200;
  }

  private toProviderBusinessError(
    payload: Record<string, unknown>
  ): SwapProviderError {
    const code = this.pickNumber(payload, ['code', 'status']) || 500;
    const message =
      this.pickString(payload, ['error', 'message', 'msg']) ||
      `provider business error(${code})`;

    if (code === 408 || code === 504) {
      return new SwapProviderError('SWAP_PROVIDER_TIMEOUT', message);
    }

    if (code >= 500 || code === 429) {
      return new SwapProviderError('SWAP_PROVIDER_UNAVAILABLE', message);
    }

    return new SwapProviderError('SWAP_INVALID_PARAM', message);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private asArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }
    const raw = this.asRecord(value);
    const tokenList = raw.tokenList;
    if (Array.isArray(tokenList)) {
      return tokenList;
    }
    const tokens = raw.tokens;
    if (Array.isArray(tokens)) {
      return tokens;
    }
    return [];
  }

  private pickString(
    source: Record<string, unknown>,
    keys: string[]
  ): string | undefined {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) {
        continue;
      }
      const result = String(value).trim();
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  private pickNumber(
    source: Record<string, unknown>,
    keys: string[]
  ): number | undefined {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) {
        continue;
      }
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }

  private resolveTxPayload(
    responseData: Record<string, unknown>
  ): Record<string, unknown> {
    const directTx = this.asRecord(responseData.tx);
    if (Object.keys(directTx).length > 0) {
      return directTx;
    }

    const nestedData = this.asRecord(responseData.data);
    if (Object.keys(nestedData).length > 0) {
      return nestedData;
    }

    return responseData;
  }

  private async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
