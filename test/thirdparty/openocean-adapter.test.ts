import { OpenOceanAdapter } from '../../src/thirdparty/swap/providers/openocean/openocean';
import { OPENOCEAN_PROVIDER } from '../../src/thirdparty/swap/provider.interface';
import { SwapProviderError } from '../../src/thirdparty/swap/provider.errors';

const toJsonResponse = (payload: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
  text: async () => JSON.stringify(payload),
});

describe('OpenOceanAdapter', () => {
  describe('getNetworks', () => {
    it('returns all supported networks with correct structure', async () => {
      const adapter = new OpenOceanAdapter();
      const networks = await adapter.getNetworks();

      expect(networks).toBeDefined();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);

      for (const net of networks) {
        expect(net).toMatchObject({
          provider: OPENOCEAN_PROVIDER,
          chainCode: expect.any(String),
          chainId: expect.any(String),
          chainName: expect.any(String),
        });
        expect(typeof net.nativeTokenAddress).toBe('string');
        expect(net.isActive).toBe(true);
        expect(net.syncedAt).toBeInstanceOf(Date);
      }
    });

    it('includes known EVM chains (eth, bsc, polygon)', async () => {
      const adapter = new OpenOceanAdapter();
      const networks = await adapter.getNetworks();
      const chainCodes = networks.map(n => n.chainCode);

      expect(chainCodes).toContain('eth');
      expect(chainCodes).toContain('bsc');
      expect(chainCodes).toContain('polygon');

      const eth = networks.find(n => n.chainCode === 'eth');
      expect(eth).toMatchObject({
        provider: OPENOCEAN_PROVIDER,
        chainCode: 'eth',
        chainId: '1',
        chainName: 'Ethereum',
      });
      expect(eth?.nativeTokenAddress).toBe(
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
      );

      const polygon = networks.find(n => n.chainCode === 'polygon');
      expect(polygon?.nativeTokenAddress).toBe(
        '0x0000000000000000000000000000000000001010'
      );
    });

    it('includes Non-EVM chains (solana, sui)', async () => {
      const adapter = new OpenOceanAdapter();
      const networks = await adapter.getNetworks();

      const solana = networks.find(n => n.chainCode === 'solana');
      expect(solana).toBeDefined();
      expect(solana?.chainName).toBe('Solana');
      expect(solana?.nativeTokenAddress).toBe(
        'So11111111111111111111111111111111111111112'
      );

      const sui = networks.find(n => n.chainCode === 'sui');
      expect(sui).toBeDefined();
      expect(sui?.chainName).toBe('Sui');
    });
  });

  describe('getTokenList', () => {
    it('maps provider token list for BSC', async () => {
      const adapter = new OpenOceanAdapter({
        fetcher: async url => {
          expect(url).toContain('/v4/bsc/tokenList');
          return toJsonResponse({
            code: 200,
            data: [
              {
                address: '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 18,
                icon: 'https://example.com/usdt.png',
              },
            ],
          });
        },
      });

      const tokens = await adapter.getTokenList('bsc');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({
        provider: OPENOCEAN_PROVIDER,
        chainCode: 'bsc',
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 18,
        logoURI: 'https://example.com/usdt.png',
        isActive: true,
      });
      expect(tokens[0].syncedAt).toBeInstanceOf(Date);
      expect(tokens[0].raw).toBeDefined();
    });

    it('maps provider token list for Ethereum', async () => {
      const adapter = new OpenOceanAdapter({
        fetcher: async url => {
          expect(url).toContain('/v4/eth/tokenList');
          return toJsonResponse({
            code: 200,
            data: {
              tokenList: [
                {
                  address: '0x0000000000000000000000000000000000000001',
                  symbol: 'AAA',
                },
              ],
            },
          });
        },
      });

      const tokens = await adapter.getTokenList('eth');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({
        provider: OPENOCEAN_PROVIDER,
        chainCode: 'eth',
        address: '0x0000000000000000000000000000000000000001',
        symbol: 'AAA',
        isActive: true,
      });
    });
  });

  describe('buildTx (swap)', () => {
    const bscUsdt = '0x55d398326f99059ff775485246999027b3197955';
    const bscUsdc = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d';
    const account = '0x9116780aEf4B376499358fa7dEeC00cCF64fA801';

    it('returns tx with calldata when account is provided', async () => {
      const adapter = new OpenOceanAdapter({
        fetcher: async url => {
          expect(url).toContain('/v4/bsc/swap');
          return toJsonResponse({
            code: 200,
            data: {
              tx: {
                to: '0x1111111111111111111111111111111111111111',
                data: '0xabcdef',
                value: '0',
              },
            },
          });
        },
      });
      const result = await adapter.buildTx({
        chainCode: 'bsc',
        inTokenAddress: bscUsdt,
        outTokenAddress: bscUsdc,
        amountDecimals: '5000000000000000000',
        gasPriceDecimals: '1000000000',
        slippage: 1,
        account,
      });

      expect(result).toMatchObject({
        provider: OPENOCEAN_PROVIDER,
        chainCode: 'bsc',
      });
      expect(result.tx.to).toBe('0x1111111111111111111111111111111111111111');
      expect(result.tx.data).toBe('0xabcdef');
      expect(result.tx.value).toBe('0');
    });

    it('throws invalid param when account is not provided', async () => {
      const adapter = new OpenOceanAdapter();
      await expect(
        adapter.buildTx({
          chainCode: 'bsc',
          inTokenAddress: bscUsdt,
          outTokenAddress: bscUsdc,
          amountDecimals: '5000000000000000000',
          gasPriceDecimals: '1000000000',
          slippage: 1,
        })
      ).rejects.toMatchObject<Partial<SwapProviderError>>({
        name: 'SwapProviderError',
        code: 'SWAP_INVALID_PARAM',
      });
    });
  });
});
