import { Init, Inject, Provide } from '@midwayjs/core';
import { ResParamsError } from '../../base/reply';
import { OpenOceanAdapter } from './providers/openocean/openocean';
import {
  BuildTxRequest,
  BuildTxResult,
  ISwapProvider,
  OPENOCEAN_PROVIDER,
  QuoteAcrossProvidersResult,
  QuoteRequest,
  QuoteResult,
  Network,
  Token,
} from './provider.interface';

@Provide()
export class ProviderManager {
  @Inject()
  openOceanAdapter: OpenOceanAdapter;

  private readonly providers = new Map<string, ISwapProvider>();

  @Init()
  async init() {
    if (this.openOceanAdapter) {
      this.registerProvider(this.openOceanAdapter);
    }
  }

  registerProvider(provider: ISwapProvider) {
    const providerKey = this.normalizeProvider(provider.provider);
    this.providers.set(providerKey, provider);
  }

  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async getNetworks(provider: string): Promise<Network[]> {
    const providerInstance = this.getProvider(provider);
    return providerInstance.getNetworks();
  }

  async getTokenList(provider: string, chainCode: string): Promise<Token[]> {
    const providerInstance = this.getProvider(provider);
    return providerInstance.getTokenList(chainCode);
  }

  async quote(provider: string, request: QuoteRequest): Promise<QuoteResult> {
    const providerInstance = this.getProvider(provider);
    return providerInstance.quote(request);
  }

  async buildTx(
    provider: string,
    request: BuildTxRequest
  ): Promise<BuildTxResult> {
    const providerInstance = this.getProvider(provider);
    return providerInstance.buildTx(request);
  }

  async quoteAcrossProviders(
    providers: string[],
    request: QuoteRequest
  ): Promise<QuoteAcrossProvidersResult> {
    const providerList = this.normalizeProviders(providers);
    const settledResults = await Promise.allSettled(
      providerList.map(async provider => {
        const quote = await this.quote(provider, request);
        return {
          provider,
          quote,
        };
      })
    );

    const quotes: QuoteResult[] = [];
    const failedProviders: QuoteAcrossProvidersResult['failedProviders'] = [];

    for (const settledResult of settledResults) {
      if (settledResult.status === 'fulfilled') {
        quotes.push(settledResult.value.quote);
        continue;
      }

      const failedProvider = this.unwrapProviderName(settledResult.reason);
      failedProviders.push({
        provider: failedProvider,
        errorCode: 'SWAP_PROVIDER_UNAVAILABLE',
        message: String(settledResult.reason || ''),
      });
    }

    return {
      quotes,
      failedProviders,
    };
  }

  private getProvider(provider: string): ISwapProvider {
    const providerKey = this.normalizeProvider(provider);
    const providerInstance = this.providers.get(providerKey);

    if (!providerInstance) {
      throw ResParamsError(`provider not registered: ${providerKey}`);
    }

    return providerInstance;
  }

  private normalizeProvider(provider: string): string {
    const providerKey = String(provider || '')
      .trim()
      .toLowerCase();
    return providerKey || OPENOCEAN_PROVIDER;
  }

  private normalizeProviders(providers: string[]): string[] {
    const normalized = (providers || [])
      .map(provider => this.normalizeProvider(provider))
      .filter(Boolean);
    const deduped = Array.from(new Set(normalized));
    return deduped.length > 0 ? deduped : [OPENOCEAN_PROVIDER];
  }

  private unwrapProviderName(error: unknown): string {
    if (error instanceof Error) {
      return String(error.message || OPENOCEAN_PROVIDER);
    }
    return OPENOCEAN_PROVIDER;
  }
}
