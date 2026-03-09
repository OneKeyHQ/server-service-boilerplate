import { SwapProviderErrorCode } from './provider.errors';

export const OPENOCEAN_PROVIDER = 'openocean';

export interface Network {
  provider: string;
  chainCode: string;
  chainId: string;
  nativeTokenAddress: string;
  chainName?: string;
  isActive?: boolean;
  syncedAt?: Date;
}

export interface Token {
  provider: string;
  chainCode: string;
  address: string;
  symbol: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
  isActive?: boolean;
  syncedAt?: Date;
  raw?: Record<string, unknown>;
}

export interface QuoteRequest {
  chainCode: string;
  inTokenAddress: string;
  outTokenAddress: string;
  amountDecimals: string;
  slippage?: string | number;
  account?: string;
  gasPriceDecimals: string;
  enabledDexIds?: string;
  disabledDexIds?: string;
}

export interface QuoteResult {
  provider: string;
  chainCode: string;
  inAmount: string;
  outAmount: string;
  minOutAmount?: string;
  estimatedGas?: string;
  gasPrice?: string;
  route?: unknown;
  raw?: Record<string, unknown>;
}

export interface BuildTxRequest extends QuoteRequest {
  receiver?: string;
  referrer?: string;
}

export interface BuildTxResult {
  provider: string;
  chainCode: string;
  tx: {
    to: string;
    data: string;
    value: string;
    gasLimit?: string;
    gasPrice?: string;
    chainId?: string;
    nonce?: string;
  };
}

export interface QuoteAcrossProvidersResult {
  quotes: QuoteResult[];
  failedProviders: Array<{
    provider: string;
    errorCode: SwapProviderErrorCode;
    message: string;
  }>;
}

export interface ISwapProvider {
  provider: string;
  getNetworks(): Promise<Network[]>;
  getTokenList(chainCode: string): Promise<Token[]>;
  quote(request: QuoteRequest): Promise<QuoteResult>;
  buildTx(request: BuildTxRequest): Promise<BuildTxResult>;
}
