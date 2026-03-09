import { ProviderManager } from '../../src/thirdparty/swap/provider-manager';
import {
  BuildTxRequest,
  BuildTxResult,
  ISwapProvider,
  Network,
  QuoteRequest,
  QuoteResult,
  Token,
} from '../../src/thirdparty/swap/provider.interface';
import { SwapProviderError } from '../../src/thirdparty/swap/provider.errors';

class MockProvider implements ISwapProvider {
  provider: string;

  private readonly quoteImpl: (request: QuoteRequest) => Promise<QuoteResult>;

  constructor(
    provider: string,
    quoteImpl: (request: QuoteRequest) => Promise<QuoteResult>
  ) {
    this.provider = provider;
    this.quoteImpl = quoteImpl;
  }

  async getNetworks(): Promise<Network[]> {
    return [];
  }

  async getTokenList(_: string): Promise<Token[]> {
    return [];
  }

  async quote(request: QuoteRequest): Promise<QuoteResult> {
    return this.quoteImpl(request);
  }

  async buildTx(_: BuildTxRequest): Promise<BuildTxResult> {
    return {
      provider: this.provider,
      chainCode: 'eth',
      tx: {
        to: '0x1',
        data: '0x2',
        value: '0',
      },
    };
  }
}

describe('ProviderManager', () => {
  it('routes quote requests to the matched provider', async () => {
    const manager = new ProviderManager();
    manager.registerProvider(
      new MockProvider('openocean', async () => ({
        provider: 'openocean',
        chainCode: 'eth',
        inAmount: '1',
        outAmount: '2',
      }))
    );

    const result = await manager.quote('openocean', {
      chainCode: 'eth',
      inTokenAddress: '0xaaa',
      outTokenAddress: '0xbbb',
      amountDecimals: '1',
      gasPriceDecimals: '1',
    });

    expect(result.provider).toBe('openocean');
    expect(result.outAmount).toBe('2');
  });

  it('throws 404 error when provider is not registered', async () => {
    const manager = new ProviderManager();

    await expect(
      manager.quote('missing-provider', {
        chainCode: 'eth',
        inTokenAddress: '0xaaa',
        outTokenAddress: '0xbbb',
        amountDecimals: '1',
        gasPriceDecimals: '1',
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('returns partial success for quoteAcrossProviders', async () => {
    const manager = new ProviderManager();
    manager.registerProvider(
      new MockProvider('openocean', async () => ({
        provider: 'openocean',
        chainCode: 'eth',
        inAmount: '1',
        outAmount: '2',
      }))
    );
    manager.registerProvider(
      new MockProvider('broken', async () => {
        throw new SwapProviderError('SWAP_PROVIDER_TIMEOUT', 'broken');
      })
    );

    const result = await manager.quoteAcrossProviders(['openocean', 'broken'], {
      chainCode: 'eth',
      inTokenAddress: '0xaaa',
      outTokenAddress: '0xbbb',
      amountDecimals: '1',
      gasPriceDecimals: '1',
    });

    expect(result.quotes).toHaveLength(1);
    expect(result.failedProviders).toHaveLength(1);
    expect(result.failedProviders[0]).toMatchObject({
      provider: 'broken',
      errorCode: 'SWAP_PROVIDER_UNAVAILABLE',
    });
  });
});
