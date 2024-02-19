import { LightningScenario } from './signature-validate';

export const getNonceKey = (username: string) => `ln-nonce-${username}`;

export const getSignatureRandomNumberKey = (
  address: string,
  type: 'register' | 'auth' | 'transfer'
) => `${LightningScenario}:${type}:${address}`;

export const generateRandomNumber = () =>
  Math.floor(1000 + Math.random() * 9000);
