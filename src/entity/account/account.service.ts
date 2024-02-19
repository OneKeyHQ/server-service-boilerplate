import { HttpService } from '@midwayjs/axios';
import { CacheManager } from '@midwayjs/cache';
import { Logger } from '@midwayjs/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { IMidwayLogger } from '@midwayjs/logger';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex as toHex } from '@noble/hashes/utils';
import { AxiosError } from 'axios';
import { pick } from 'lodash';

import {
  FailedCreateUserError,
  InvalidSignatureError,
  OneKeyError,
} from '../../error';
import { NetworkEnvService } from '../../service/networkEnv.service';
import { ICreateUserResponse } from '../../types/account';
import {
  LightningScenario,
  extractErrorMessage,
  // generateSigatureTemplate,
  getSignatureRandomNumberKey,
  verifySignatureMessage,
} from '../../utils';
import { ErrorResponse } from '../../utils/axios-error';

import { CreateUserDTO, GetSignTemplateDTO } from './account.dto';

@Provide()
export class AccountService {
  @Inject()
  cacheManager: CacheManager;

  @Inject()
  httpService: HttpService;

  @Inject()
  networkEnvService: NetworkEnvService;

  @Logger()
  logger: IMidwayLogger;

  private generatePassword(params: CreateUserDTO) {
    const password = `${params.address}--${params.hashPubKey}--${params.signature}`;
    return toHex(sha256(password));
  }

  async createUser(params: CreateUserDTO) {
    // TODO: checkServiceState
    console.log('=====>>>: p: ', params);
    const foo = 1;
    if (foo >= 2) {
      const randomSeed = await this.getCacheRandomSeed({
        signType: 'register',
        address: params.address,
        testnet: params.testnet,
      });
      const verifySignature = verifySignatureMessage(
        {
          scenario: LightningScenario,
          type: 'register',
          pubkey: params.hashPubKey,
          address: params.address,
          randomSeed,
        },
        params.address,
        params.signature
      );
      if (!verifySignature) {
        throw new InvalidSignatureError();
      }
    }

    try {
      console.log(this.networkEnvService.getBaseUrl(params.testnet));
      const { data } = await this.httpService.post<ICreateUserResponse>(
        `${this.networkEnvService.getBaseUrl(params.testnet)}/v2/users`,
        {
          login: params.address,
          password: this.generatePassword(params),
        },
        {
          headers: {
            Authorization: `Bearer ${this.networkEnvService.getAdminToken(
              params.testnet
            )}`,
          },
        }
      );
      return pick(data, ['id', 'login']);
    } catch (e: unknown) {
      const error: AxiosError<ErrorResponse> = e as AxiosError<ErrorResponse>;
      const errorMessage = extractErrorMessage(error);
      this.logger.error(`Create User Error: ${errorMessage}`);
      throw new FailedCreateUserError();
    }
  }

  private async getCacheRandomSeed(params: GetSignTemplateDTO) {
    const key = getSignatureRandomNumberKey(params.address, params.signType);
    const randomNumber = await this.cacheManager.get(key);
    if (typeof randomNumber === 'number') {
      return randomNumber;
    }
    throw new OneKeyError(
      `Can Not Find Random Seed for ${params.address}, signType: ${params.signType}`
    );
  }
}
