export type SwapProviderErrorCode =
  | 'SWAP_INVALID_PARAM'
  | 'SWAP_PROVIDER_TIMEOUT'
  | 'SWAP_PROVIDER_UNAVAILABLE'
  | 'SWAP_QUOTE_EMPTY'
  | 'SWAP_BUILD_TX_FAILED';

export class SwapProviderError extends Error {
  name: string;
  message: string;
  code: SwapProviderErrorCode;

  constructor(code: SwapProviderErrorCode, message: string) {
    super();
    this.name = 'SwapProviderError';
    this.message = message;
    this.code = code;
  }
}
