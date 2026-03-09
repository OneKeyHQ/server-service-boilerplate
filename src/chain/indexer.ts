import {
  buildUnsignedTx as buildEvmUnsignedTx,
  EvmUnsignedTx,
  type BuildUnsignedTxInput as EvmBuildUnsignedTxInput,
} from './evm';
import { SolanaUnsignedTx } from './sol';

const EVM_CHAIN_CODES = new Set([
  'eth',
  'bsc',
  'base',
  'polygon',
  'arbitrum',
  'linea',
  'avax',
  'optimism',
  'zksync',
  'opbnb',
  'mantle',
  'scroll',
  'blast',
  'mode',
  'fantom',
  'celo',
  'xdai',
  'metis',
  'rootstock',
  'moonriver',
  'polygon_zkevm',
  'cronos',
  'harmony',
  'kava',
  'aurora',
  'manta',
  'gravity',
  'flare',
  'ape',
  'swell',
  'plume',
  'tac',
  'bera',
  'uni',
  'hyperevm',
  'sonic',
  'sei',
  'plasma',
  'monad',
  'telos',
]);

export const EVM_CHAIN_RPC_MAP: Record<string, string> = {
  eth: 'https://eth-mainnet.public.blastapi.io',
  bsc: 'https://bsc-dataseed.bnbchain.org',
  base: 'https://mainnet.base.org',
  polygon: 'https://polygon-rpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  linea: 'https://rpc.linea.build',
  avax: 'https://api.avax.network/ext/bc/C/rpc',
  optimism: 'https://mainnet.optimism.io',
  zksync: 'https://mainnet.era.zksync.io',
  opbnb: 'https://opbnb-mainnet-rpc.bnbchain.org',
  mantle: 'https://rpc.mantle.xyz',
  scroll: 'https://rpc.scroll.io',
  fantom: 'https://rpc.fantom.network',
  celo: 'https://forno.celo.org',
  xdai: 'https://rpc.gnosischain.com',
  metis: 'https://andromeda.metis.io/?owner=1088',
  rootstock: 'https://public-node.rsk.co',
  moonriver: 'https://rpc.api.moonriver.moonbeam.network',
  cronos: 'https://evm.cronos.org',
  harmony: 'https://api.harmony.one',
  kava: 'https://evm.kava.io',
  aurora: 'https://mainnet.aurora.dev',
};

export function isEvmChainCode(chainCode: string): boolean {
  const normalized = normalizeChainCode(chainCode);
  return EVM_CHAIN_CODES.has(normalized);
}

// 联合类型
export type UnsignedTx = EvmUnsignedTx | SolanaUnsignedTx;

export async function buildUnsignedTx(
  chainCode: string,
  to: string,
  from: string,
  data?: string,
  value?: string,
  gasLimitBufferBps?: number,
  options?: {
    rpcUrl?: string;
    providerFactory?: EvmBuildUnsignedTxInput['providerFactory'];
  }
): Promise<UnsignedTx> {
  const normalizedChainCode = normalizeChainCode(chainCode);
  if (isEvmChainCode(normalizedChainCode)) {
    return await buildEvmUnsignedTx({
      to,
      from,
      data,
      value,
      gasLimitBufferBps,
      rpcUrl: options?.rpcUrl || getEvmRpcUrl(normalizedChainCode),
      providerFactory: options?.providerFactory,
    });
  }

  throw new Error(`chainCode not supported yet: ${normalizedChainCode}`);
}

export function getEvmRpcUrl(chainCode: string): string {
  const normalized = normalizeChainCode(chainCode);
  if (!isEvmChainCode(normalized)) {
    throw new Error(`chainCode not supported yet: ${normalized}`);
  }

  const rpcUrl = EVM_CHAIN_RPC_MAP[normalized];
  if (!rpcUrl) {
    throw new Error(`rpc url not configured for chainCode: ${normalized}`);
  }
  return rpcUrl;
}

function normalizeChainCode(chainCode: string): string {
  const normalized = String(chainCode || '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    throw new Error('chainCode is required');
  }
  return normalized;
}
