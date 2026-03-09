export const UserMOdelProjection = ['userId', 'name', 'email'];

export const SwapNetworkModelProjection = [
  'id',
  'provider',
  'chainName',
  'chainCode',
  'chainId',
  'nativeTokenAddress',
  'isActive',
  'metadata',
  'syncedAt',
  'createdAt',
  'updatedAt',
];

export const SwapTokenModelProjection = [
  'id',
  'provider',
  'chainCode',
  'address',
  'symbol',
  'name',
  'decimals',
  'logoURI',
  'isActive',
  'raw',
  'syncedAt',
  'createdAt',
  'updatedAt',
];

export const SwapProviderModelProjection = [
  'id',
  'provider',
  'status',
  'priority',
  'timeoutMs',
  'rateLimitQps',
  'meta',
  'createdAt',
  'updatedAt',
];
