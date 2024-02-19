import bitcoinMessage from 'bitcoinjs-message';
import stringify from 'fast-json-stable-stringify';

export const LightningScenario = 'onekey-lightning-network';

type RegisterMsgType = {
  scenario: typeof LightningScenario;
  type: 'register';
  pubkey: string;
  address: string;
  randomSeed: number;
};
type AuthMsgType = {
  scenario: typeof LightningScenario;
  type: 'auth';
  pubkey: string;
  address: string;
  timestamp: number;
  randomSeed: number;
};
type PaymentBolt11MsgType = {
  scenario: typeof LightningScenario;
  type: 'transfer';
  invoice: string;
  paymentHash: string;
  expired: string;
  created: number;
  nonce: number;
  randomSeed: number;
};

type UnionMsgType = RegisterMsgType | AuthMsgType | PaymentBolt11MsgType;

const generateRegisterMessage = (
  payload: RegisterMsgType
): RegisterMsgType => ({
  scenario: LightningScenario,
  type: 'register',
  pubkey: payload.pubkey,
  address: payload.address,
  randomSeed: payload.randomSeed,
});

const generateAuthMessage = (payload: AuthMsgType): AuthMsgType => ({
  scenario: LightningScenario,
  type: 'auth',
  pubkey: payload.pubkey,
  address: payload.address,
  timestamp: payload.timestamp,
  randomSeed: payload.randomSeed,
});

const generateTransferMessage = (
  payload: PaymentBolt11MsgType
): PaymentBolt11MsgType => ({
  scenario: LightningScenario,
  type: 'transfer',
  invoice: payload.invoice,
  paymentHash: payload.paymentHash,
  expired: payload.expired,
  created: payload.created,
  nonce: payload.nonce,
  randomSeed: payload.randomSeed,
});

export const generateSigatureTemplate = ({
  type,
  randomSeed,
  address,
  nonce,
}: {
  type: 'register' | 'auth' | 'transfer';
  randomSeed: number;
  address: string;
  nonce?: number;
}): UnionMsgType => {
  if (type === 'register') {
    return generateRegisterMessage({
      scenario: LightningScenario,
      type: 'register',
      pubkey: '',
      address,
      randomSeed,
    });
  }
  if (type === 'auth') {
    return generateAuthMessage({
      scenario: LightningScenario,
      type: 'auth',
      pubkey: '',
      address,
      timestamp: NaN,
      randomSeed,
    });
  }
  if (type === 'transfer') {
    return generateTransferMessage({
      scenario: LightningScenario,
      type: 'transfer',
      invoice: '',
      paymentHash: '',
      expired: '',
      created: NaN,
      nonce,
      randomSeed,
    });
  }
};

const generateMessage = (msgPayload: UnionMsgType) => {
  if (msgPayload.type === 'register') {
    return generateRegisterMessage(msgPayload);
  }
  if (msgPayload.type === 'auth') {
    return generateAuthMessage(msgPayload);
  }
  if (msgPayload.type === 'transfer') {
    return generateTransferMessage(msgPayload);
  }
  return {};
};

const verify = (message: string, address: string, signature: string): boolean =>
  bitcoinMessage.verify(message, address, Buffer.from(signature, 'hex'));

export const verifySignatureMessage = (
  msgPayload: UnionMsgType,
  address: string,
  signature: string
) => {
  const message = generateMessage(msgPayload);
  console.log('verify message: ', stringify(message), signature);
  try {
    return verify(stringify(message), address, signature);
  } catch (e: any) {
    console.log(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
      `verify signature error: ${e.message}, payload: ${stringify(
        message
      )}, signature: ${signature}, address: ${address}`
    );
    return false;
  }
};

export function checkSignatureTimestamp(timestamp: number) {
  const currentTimestamp = Date.now();
  const difference = currentTimestamp - timestamp;
  const differenceInMinutes = Math.floor(difference / (1000 * 60));
  return differenceInMinutes < 5;
}
