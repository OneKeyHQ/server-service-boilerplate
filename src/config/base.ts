/* eslint-disable no-process-env */
import { join } from 'path';

import * as redisStore from 'cache-manager-ioredis';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import * as dotenv from 'dotenv';

import localeConfig from '../locales';
import { ServerEnv } from '../types/config/config.dto';

dotenv.config({
  path: join(__dirname, '../../.env'),
});

export const getRedisConfig = (
  db = 0,
  options: Record<string, unknown> = {}
) => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  password: process.env.REDIS_PWD,
  db,
  ...options,
});

const envConfig = {
  redis: getRedisConfig(parseInt(process.env.REDIS_DB, 10)),
  mongoose: {
    dataSource: {
      default: {
        uri: process.env.MONGODB_URI,
        options: {
          user: process.env.MONGODB_USER,
          pass: process.env.MONGODB_PASSWORD,
        },
      },
    },
  },
  NODE_ENV: process.env.NODE_ENV,
  aws: {
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_KEY,
    awsRegion: process.env.AWS_REGION,
  },
  keys: process.env.COOKIE_SIGN_KEY,
  i18n: {
    defaultLocale: 'en-us',
    localeTable: localeConfig,
    fallbacks: {
      '*': 'en-us',
    },
    writeCookie: false,
    resolver: false,
  },
  koa: {
    port: 9017,
    globalPrefix: '/lightning',
  },
  cache: {
    store: redisStore,
    max: 1000,
    options: {
      keyPrefix: 'cache:lightning:',
    },
  },
  bull: {
    defaultQueuOptions: {
      redis: getRedisConfig(),
    },
    defaultConcurrency: 1,
    clearRepeatJobWhenStart: true,
  },
  lndhubJwtSecret: process.env.LNDHUB_JWT_SECRET,
  lnurlEndpoint: process.env.LNURL_ENDPOINT,
  lndRpc: {
    rpcHost: process.env.LND_RPC_HOST,
    grpcHost: process.env.LND_GRPC_HOST,
    websocketHost: process.env.LND_WEBSOCKET_HOST,
    grpcMacaroon: process.env.LND_GRPC_MACAROON,
    grpcCert: process.env.LND_GRPC_CERT,
    withdrawAddress: process.env.LND_WITHDRAW_ADDRESS,
  },
  lndRpcTestnet: {
    rpcHost: process.env.LND_RPC_HOST_TESTNET,
    grpcHost: process.env.LND_GRPC_HOST_TESTNET,
    websocketHost: process.env.LND_WEBSOCKET_HOST_TESTNET,
    grpcMacaroon: process.env.LND_GRPC_MACAROON_TESTNET,
    grpcCert: process.env.LND_GRPC_CERT_TESTNET,
    withdrawAddress: process.env.LND_WITHDRAW_ADDRESS_TESTNET,
  },
  lndhub: {
    baseUrl: process.env.LNDHUB_HOST,
    jwtAccessExpiry: Number(process.env.LNDHUB_JWT_ACCESS_EXPIRY),
    jwtRefreshExpiry: Number(process.env.LNDHUB_JWT_REFRESH_EXPIRY),
    adminToken: process.env.LNDHUB_ADMIN_TOKEN,
    identityPubKey: process.env.LND_IDENTITY_PUBKEY,
    maxReceiveAmount: Number(process.env.LNDHUB_MAX_RECEIVE_AMOUNT),
    maxSendAmount: Number(process.env.LNDHUB_MAX_SEND_AMOUNT),
  },
  lndhubTestnet: {
    baseUrl: process.env.LNDHUB_HOST_TESTNET,
    jwtAccessExpiry: Number(process.env.LNDHUB_JWT_ACCESS_EXPIRY),
    jwtRefreshExpiry: Number(process.env.LNDHUB_JWT_REFRESH_EXPIRY),
    adminToken: process.env.LNDHUB_ADMIN_TOKEN_TESTNET,
    identityPubKey: process.env.LND_IDENTITY_PUBKEY_TESTNET,
  },
  postgres: {
    url: process.env.POSTGRES_URI,
    testnetUrl: process.env.POSTGRES_URI_TESTNET,
  },
};

function getBaseConfig() {
  const parsed = plainToInstance(ServerEnv, envConfig);
  const validationErr = validateSync(parsed);

  if (validationErr.length > 0) {
    const simpleErrs = [];
    // eslint-disable-next-line no-console
    console.error(validationErr);

    validationErr.forEach(err => {
      if (err.children && err.children.length > 0) {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(err.children || {}));
        simpleErrs.push(err.children[0].constraints);
      } else {
        simpleErrs.push(err.constraints);
      }
    });

    throw new Error(`Invalid custom config ${JSON.stringify(simpleErrs)}`);
  }

  return envConfig;
}

export const baseConfig = getBaseConfig();
