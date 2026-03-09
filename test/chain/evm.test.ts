import {
  buildUnsignedTx,
  estimateGasLimit,
  getFeeData,
  getNonce,
} from '../../src/chain/evm';

const providerFactory = () =>
  ({
    estimateGas: jest.fn(async () => BigInt(21000)),
    getFeeData: jest.fn(async () => ({
      gasPrice: BigInt(1000000000),
      maxFeePerGas: BigInt(2000000000),
      maxPriorityFeePerGas: BigInt(100000000),
    })),
    getTransactionCount: jest.fn(async () => 7),
    getNetwork: jest.fn(async () => ({ chainId: BigInt(56) })),
  } as any);

describe('evm chain helpers', () => {
  it('estimateGasLimit returns buffered bigint', async () => {
    const gas = await estimateGasLimit({
      rpcUrl: 'https://rpc.mock',
      providerFactory,
      to: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      from: '0x9116780aEf4B376499358fa7dEeC00cCF64fA801',
      bufferBps: 12000,
    });
    expect(gas).toBe(BigInt(25200));
  });

  it('getFeeData returns normalized fee data', async () => {
    const data = await getFeeData({
      rpcUrl: 'https://rpc.mock',
      providerFactory,
    });
    expect(data).toMatchObject({
      supportsEip1559: true,
      gasPrice: BigInt(1000000000),
    });
  });

  it('getNonce returns pending nonce', async () => {
    const nonce = await getNonce({
      rpcUrl: 'https://rpc.mock',
      providerFactory,
      address: '0x9116780aEf4B376499358fa7dEeC00cCF64fA801',
    });
    expect(nonce).toBe(7);
  });

  it('buildUnsignedTx builds EIP-1559 unsigned tx', async () => {
    const tx = await buildUnsignedTx({
      rpcUrl: 'https://rpc.mock',
      providerFactory,
      to: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      from: '0x9116780aEf4B376499358fa7dEeC00cCF64fA801',
      data: '0x1234',
      value: '0',
      gasLimitBufferBps: 12000,
    });

    expect(tx).toMatchObject({
      type: 2,
      chainId: 56,
      nonce: 7,
      gasLimit: '0x6270',
      maxFeePerGas: '0x77359400',
      maxPriorityFeePerGas: '0x5f5e100',
    });
    expect(tx.serialized.startsWith('0x')).toBe(true);
  });

  it('throws readable error when data is not hex', async () => {
    await expect(
      buildUnsignedTx({
        rpcUrl: 'https://rpc.mock',
        providerFactory,
        to: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        from: '0x9116780aEf4B376499358fa7dEeC00cCF64fA801',
        data: 'not-hex',
      })
    ).rejects.toThrow('data must be a hex string');
  });
});
