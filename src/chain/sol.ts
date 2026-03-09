export interface SolanaUnsignedTx {
  to: string;
  from: string;
  data: string;
  value: string;
  nonce: string;
  chainId: string;
  gasLimit: string;
  gasPrice: string;
}
