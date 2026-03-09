import {
  getAddress,
  isHexString,
  JsonRpcProvider,
  toQuantity,
  Transaction,
  type Provider,
} from 'ethers';

// ═══════════════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════════════

type ProviderFactory = (rpcUrl: string) => Provider;

interface WithProvider {
  rpcUrl: string;
  providerFactory?: ProviderFactory;
}

export interface EstimateGasInput extends WithProvider {
  to: string;
  from: string;
  data?: string;
  value?: string;
  /** 10_000 = 100% (no buffer), 12_000 = 120%, etc. */
  bufferBps?: number;
}

export interface FeeDataResult {
  gasPrice: bigint | null;
  maxFeePerGas: bigint | null;
  maxPriorityFeePerGas: bigint | null;
  supportsEip1559: boolean;
}

export interface GetNonceInput extends WithProvider {
  address: string;
  blockTag?: 'latest' | 'pending';
}

export interface BuildUnsignedTxInput extends WithProvider {
  to: string;
  from: string;
  data?: string;
  /** Wei, decimal or hex string. Defaults to "0". */
  value?: string;
  /** Gas-limit multiplier in basis points. 12_000 = 120%. */
  gasLimitBufferBps?: number;
}

export interface EvmUnsignedTx {
  /** 0 = legacy, 2 = EIP-1559 */
  type: number;
  to: string;
  from: string;
  data: string;
  /** Hex quantity (wei) */
  value: string;
  nonce: number;
  chainId: number;
  /** Hex quantity */
  gasLimit: string;
  /** Hex quantity — only on legacy (type 0) */
  gasPrice?: string;
  /** Hex quantity — only on EIP-1559 (type 2) */
  maxFeePerGas?: string;
  /** Hex quantity — only on EIP-1559 (type 2) */
  maxPriorityFeePerGas?: string;
  /** RLP-encoded unsigned tx, ready to be signed */
  serialized: string;
}

// ═══════════════════════════════════════════════════════════════════
//  1. estimateGasLimit
// ═══════════════════════════════════════════════════════════════════

export async function estimateGasLimit(
  input: EstimateGasInput
): Promise<bigint> {
  const provider = getProvider(input);
  const estimated = await provider.estimateGas({
    to: checksumAddress(input.to, 'to'),
    from: checksumAddress(input.from, 'from'),
    data: hexData(input.data),
    value: weiValue(input.value),
  });
  return bpsBuffer(estimated, input.bufferBps);
}

// ═══════════════════════════════════════════════════════════════════
//  2. getFeeData
// ═══════════════════════════════════════════════════════════════════

export async function getFeeData(input: WithProvider): Promise<FeeDataResult> {
  const provider = getProvider(input);
  const fd = await provider.getFeeData();
  return {
    gasPrice: fd.gasPrice,
    maxFeePerGas: fd.maxFeePerGas,
    maxPriorityFeePerGas: fd.maxPriorityFeePerGas,
    supportsEip1559: fd.maxFeePerGas != null,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  3. getNonce
// ═══════════════════════════════════════════════════════════════════

export async function getNonce(input: GetNonceInput): Promise<number> {
  const provider = getProvider(input);
  const addr = checksumAddress(input.address, 'address');
  return provider.getTransactionCount(addr, input.blockTag ?? 'pending');
}

// ═══════════════════════════════════════════════════════════════════
//  4. buildUnsignedTx  (核心)
// ═══════════════════════════════════════════════════════════════════

export async function buildUnsignedTx(
  input: BuildUnsignedTxInput
): Promise<EvmUnsignedTx> {
  const provider = getProvider(input);

  const to = checksumAddress(input.to, 'to');
  const from = checksumAddress(input.from, 'from');
  const data = hexData(input.data);
  const value = weiValue(input.value);

  // ---- 4 次 RPC 并行 ----
  const [rawGasLimit, fd, nonce, network] = await Promise.all([
    provider.estimateGas({ to, from, data, value }),
    provider.getFeeData(),
    provider.getTransactionCount(from, 'pending'),
    provider.getNetwork(),
  ]);

  const gasLimit = bpsBuffer(rawGasLimit, input.gasLimitBufferBps);
  const chainId = Number(network.chainId);

  // ---- 判断链是否支持 EIP-1559 ----
  const eip1559 = fd.maxFeePerGas != null && fd.maxPriorityFeePerGas != null;

  if (!eip1559 && fd.gasPrice == null) {
    throw new Error(
      'Unable to determine gas price: provider returned no fee data'
    );
  }

  // ---- 构造 ethers Transaction 对象 ----
  const shared = { to, data, value, nonce, chainId, gasLimit };

  const tx = eip1559
    ? Transaction.from({
        ...shared,
        type: 2,
        maxFeePerGas: fd.maxFeePerGas!,
        maxPriorityFeePerGas: fd.maxPriorityFeePerGas!,
      })
    : Transaction.from({
        ...shared,
        type: 0,
        gasPrice: fd.gasPrice!,
      });

  // ---- 组装返回值 ----
  return {
    type: tx.type,
    to,
    from,
    data,
    value: toQuantity(value),
    nonce,
    chainId,
    gasLimit: toQuantity(gasLimit),
    ...(eip1559
      ? {
          maxFeePerGas: toQuantity(fd.maxFeePerGas!),
          maxPriorityFeePerGas: toQuantity(fd.maxPriorityFeePerGas!),
        }
      : {
          gasPrice: toQuantity(fd.gasPrice!),
        }),
    serialized: tx.unsignedSerialized,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  Internal helpers
// ═══════════════════════════════════════════════════════════════════

function getProvider(opts: WithProvider): Provider {
  const url = opts.rpcUrl?.trim();
  if (!url) throw new Error('rpcUrl is required');
  return opts.providerFactory
    ? opts.providerFactory(url)
    : new JsonRpcProvider(url);
}

function checksumAddress(raw: string, label: string): string {
  const v = raw?.trim();
  if (!v) throw new Error(`${label} address is required`);
  try {
    return getAddress(v);
  } catch {
    throw new Error(`${label} is not a valid EVM address: ${raw}`);
  }
}

function hexData(raw?: string): string {
  const v = raw?.trim();
  if (!v) return '0x';
  if (!isHexString(v)) throw new Error(`data must be a hex string`);
  return v;
}

function weiValue(raw?: string): bigint {
  const v = raw?.trim();
  if (!v) return BigInt(0);
  try {
    return BigInt(v);
  } catch {
    throw new Error(`value is not a valid integer: ${raw}`);
  }
}

function bpsBuffer(amount: bigint, bps?: number): bigint {
  if (bps == null) return amount;
  if (!Number.isFinite(bps) || bps < 10_000) {
    throw new Error('bufferBps must be >= 10_000 (100%)');
  }
  return (amount * BigInt(Math.floor(bps))) / BigInt(10000);
}
