import {
  buildUnsignedTx,
  getEvmRpcUrl,
  isEvmChainCode,
} from '../../src/chain/indexer';

describe('chain indexer', () => {
  const providerFactory = () =>
    ({
      estimateGas: jest.fn(async () => BigInt(21000)),
      getFeeData: jest.fn(async () => ({
        gasPrice: BigInt(1000000000),
        maxFeePerGas: BigInt(2000000000),
        maxPriorityFeePerGas: BigInt(100000000),
      })),
      getTransactionCount: jest.fn(async () => 8),
      getNetwork: jest.fn(async () => ({ chainId: BigInt(56) })),
    } as any);

  it('routes evm chainCode to evm builder', async () => {
    const tx = await buildUnsignedTx(
      'bsc',
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      '0x9116780aEf4B376499358fa7dEeC00cCF64fA801',
      '0x',
      '0',
      12000,
      { providerFactory }
    );

    expect(tx.gasLimit).toBe('0x6270');
    expect(tx.nonce).toBe(8);
  });

  it('rejects unsupported non-evm chainCode', async () => {
    await expect(
      buildUnsignedTx(
        'solana',
        '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        '0x9116780aEf4B376499358fa7dEeC00cCF64fA801'
      )
    ).rejects.toThrow('chainCode not supported yet: solana');
  });

  it('returns false for unsupported chainCode', () => {
    expect(isEvmChainCode('sui')).toBe(false);
  });

  it('returns rpc url for configured evm chainCode', () => {
    expect(getEvmRpcUrl('bsc')).toBe('https://bsc-dataseed.bnbchain.org');
  });

  it('throws when evm chainCode rpc is not configured', () => {
    expect(() => getEvmRpcUrl('monad')).toThrow(
      'rpc url not configured for chainCode: monad'
    );
  });
});
