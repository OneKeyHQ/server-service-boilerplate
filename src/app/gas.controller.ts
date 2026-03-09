import { Controller, Get, Post, Query, Body } from '@midwayjs/core';
import { Rule, RuleType } from '@midwayjs/validate';
import { formatUnits, toQuantity } from 'ethers';
import { ResParamsError, ResInternalServerError } from '../base/reply';
import { getEvmRpcUrl, isEvmChainCode } from '../chain/indexer';
import { estimateGasLimit, getFeeData } from '../chain/evm';

class GasEstimateRequest {
  @Rule(RuleType.string().required())
  chainCode: string;

  @Rule(RuleType.string().required())
  to: string;

  @Rule(RuleType.string().required())
  from: string;

  @Rule(RuleType.string())
  data?: string;

  @Rule(RuleType.string())
  value?: string;

  @Rule(RuleType.number().min(10000))
  bufferBps?: number;
}

class GasPriceQuery {
  @Rule(RuleType.string().required())
  chainCode: string;
}

interface GasEstimateResponse {
  chainCode: string;
  gasLimit: string;
  gasLimitHex: string;
  bufferBps: number;
}

interface GasPriceTier {
  gasPrice?: string;
  gasPriceText?: string;
  maxFeePerGas?: string;
  maxFeePerGasText?: string;
  maxPriorityFeePerGas?: string;
  maxPriorityFeePerGasText?: string;
}

interface LegacyGasPriceGroups {
  slow: GasPriceTier;
  standard: GasPriceTier;
  fast: GasPriceTier;
}

interface Eip1559GasPriceGroups {
  slow: GasPriceTier;
  standard: GasPriceTier;
  fast: GasPriceTier;
}

interface GasPriceResponse {
  chainCode: string;
  unit: 'wei';
  legacy: LegacyGasPriceGroups;
  eip1559: Eip1559GasPriceGroups | null;
}

const DEFAULT_GAS_BUFFER_BPS = 12000;
const SLOW_BPS = 9000;
const STANDARD_BPS = 10000;
const FAST_BPS = 11000;

@Controller('/gas')
export class GasController {
  @Post('/estimate')
  async estimateGas(
    @Body() body: GasEstimateRequest
  ): Promise<GasEstimateResponse> {
    const chainCode = this.normalizeChainCode(body.chainCode);
    this.ensureEvmChainCode(chainCode);

    try {
      const gasLimit = await estimateGasLimit({
        rpcUrl: getEvmRpcUrl(chainCode),
        to: body.to,
        from: body.from,
        data: body.data,
        value: body.value,
        bufferBps: body.bufferBps || DEFAULT_GAS_BUFFER_BPS,
      });

      return {
        chainCode,
        gasLimit: gasLimit.toString(),
        gasLimitHex: toQuantity(gasLimit),
        bufferBps: body.bufferBps || DEFAULT_GAS_BUFFER_BPS,
      };
    } catch (error) {
      throw ResInternalServerError(
        `estimateGas failed on chain=${chainCode}: ${error}`
      );
    }
  }

  @Get('/price')
  async getGasPrice(@Query() query: GasPriceQuery): Promise<GasPriceResponse> {
    const chainCode = this.normalizeChainCode(query.chainCode);
    this.ensureEvmChainCode(chainCode);

    try {
      const feeData = await getFeeData({
        rpcUrl: getEvmRpcUrl(chainCode),
      });

      const legacyBaseGasPrice = feeData.gasPrice || feeData.maxFeePerGas;
      if (!legacyBaseGasPrice) {
        throw ResParamsError(
          `provider returned empty gas price on chain=${chainCode}`
        );
      }

      const legacy: LegacyGasPriceGroups = {
        slow: {
          gasPrice: this.applyBps(legacyBaseGasPrice, SLOW_BPS).toString(),
          gasPriceText: this.toGweiText(
            this.applyBps(legacyBaseGasPrice, SLOW_BPS)
          ),
        },
        standard: {
          gasPrice: this.applyBps(legacyBaseGasPrice, STANDARD_BPS).toString(),
          gasPriceText: this.toGweiText(
            this.applyBps(legacyBaseGasPrice, STANDARD_BPS)
          ),
        },
        fast: {
          gasPrice: this.applyBps(legacyBaseGasPrice, FAST_BPS).toString(),
          gasPriceText: this.toGweiText(
            this.applyBps(legacyBaseGasPrice, FAST_BPS)
          ),
        },
      };

      const eip1559 =
        feeData.supportsEip1559 &&
        feeData.maxFeePerGas &&
        feeData.maxPriorityFeePerGas
          ? {
              slow: {
                maxFeePerGas: this.applyBps(
                  feeData.maxFeePerGas,
                  SLOW_BPS
                ).toString(),
                maxFeePerGasText: this.toGweiText(
                  this.applyBps(feeData.maxFeePerGas, SLOW_BPS)
                ),
                maxPriorityFeePerGas: this.applyBps(
                  feeData.maxPriorityFeePerGas,
                  SLOW_BPS
                ).toString(),
                maxPriorityFeePerGasText: this.toGweiText(
                  this.applyBps(feeData.maxPriorityFeePerGas, SLOW_BPS)
                ),
              },
              standard: {
                maxFeePerGas: this.applyBps(
                  feeData.maxFeePerGas,
                  STANDARD_BPS
                ).toString(),
                maxFeePerGasText: this.toGweiText(
                  this.applyBps(feeData.maxFeePerGas, STANDARD_BPS)
                ),
                maxPriorityFeePerGas: this.applyBps(
                  feeData.maxPriorityFeePerGas,
                  STANDARD_BPS
                ).toString(),
                maxPriorityFeePerGasText: this.toGweiText(
                  this.applyBps(feeData.maxPriorityFeePerGas, STANDARD_BPS)
                ),
              },
              fast: {
                maxFeePerGas: this.applyBps(
                  feeData.maxFeePerGas,
                  FAST_BPS
                ).toString(),
                maxFeePerGasText: this.toGweiText(
                  this.applyBps(feeData.maxFeePerGas, FAST_BPS)
                ),
                maxPriorityFeePerGas: this.applyBps(
                  feeData.maxPriorityFeePerGas,
                  FAST_BPS
                ).toString(),
                maxPriorityFeePerGasText: this.toGweiText(
                  this.applyBps(feeData.maxPriorityFeePerGas, FAST_BPS)
                ),
              },
            }
          : null;

      return {
        chainCode,
        unit: 'wei',
        legacy,
        eip1559,
      };
    } catch (error) {
      throw ResInternalServerError(
        `getGasPrice failed on chain=${chainCode}: ${error}`
      );
    }
  }

  private normalizeChainCode(chainCode?: string): string {
    return String(chainCode || '')
      .trim()
      .toLowerCase();
  }

  private ensureEvmChainCode(chainCode: string) {
    if (isEvmChainCode(chainCode)) {
      return;
    }
    throw ResParamsError(`chainCode not supported yet: ${chainCode}`);
  }

  private applyBps(value: bigint, bps: number): bigint {
    return (value * BigInt(bps)) / BigInt(10000);
  }

  private toGweiText(value: bigint): string {
    return `${formatUnits(value, 'gwei')} gwei`;
  }
}
