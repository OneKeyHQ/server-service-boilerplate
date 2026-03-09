import { Inject } from '@midwayjs/core';
import { IProcessor, Processor } from '@midwayjs/bull';

import { TokenService } from '../entity/token/token.service';
import { ProviderManager } from '../thirdparty/swap/provider-manager';
import {
  OPENOCEAN_PROVIDER,
  Token,
} from '../thirdparty/swap/provider.interface';

// OpenOcean 代币同步任务调度周期（默认每 30 分钟）
const OPENOCEAN_TOKEN_SYNC_CRON =
  process.env.OPENOCEAN_TOKEN_SYNC_CRON || '*/30 * * * *';

// 定时拉取 OpenOcean 全链代币列表，并同步到本地 SwapToken 实体表
@Processor('openoceanTokenSync', {
  repeat: {
    cron: OPENOCEAN_TOKEN_SYNC_CRON,
  },
  removeOnComplete: true,
  removeOnFail: 20,
})
export class OpenOceanSchedule implements IProcessor {
  @Inject()
  providerManager: ProviderManager;

  @Inject()
  tokenService: TokenService;

  // 调度入口：按链逐个拉取 token，失败链路记录后继续处理其他链
  async execute() {
    const startedAt = Date.now();

    const networks = await this.providerManager.getNetworks(OPENOCEAN_PROVIDER);
    const chainCodes = Array.from(
      new Set(
        (networks || [])
          .map(network =>
            String(network.chainCode || '')
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      )
    );

    let syncedChainCount = 0;
    let failedChainCount = 0;
    let upsertedTokenCount = 0;

    for (const chainCode of chainCodes) {
      try {
        const tokens = await this.providerManager.getTokenList(
          OPENOCEAN_PROVIDER,
          chainCode
        );
        upsertedTokenCount += await this.syncChainTokens(chainCode, tokens);
        syncedChainCount += 1;
      } catch (error) {
        failedChainCount += 1;
        console.error(
          `[schedule.openoceanTokenSync] sync chain failed: provider=${OPENOCEAN_PROVIDER}, chainCode=${chainCode}`,
          error
        );
      }
    }

    console.info(
      `[schedule.openoceanTokenSync] done: provider=${OPENOCEAN_PROVIDER}, chainTotal=${
        chainCodes.length
      }, chainSuccess=${syncedChainCount}, chainFailed=${failedChainCount}, upsertedTokenCount=${upsertedTokenCount}, elapsedMs=${
        Date.now() - startedAt
      }`
    );
  }

  // 同步单条链的 token：存在则更新，不存在则创建（带重复键兜底）
  private async syncChainTokens(
    chainCode: string,
    tokens: Token[]
  ): Promise<number> {
    const now = new Date();
    let upserted = 0;

    for (const token of tokens || []) {
      const address = String(token.address || '')
        .trim()
        .toLowerCase();
      const symbol = String(token.symbol || '').trim();
      if (!address || !symbol) {
        continue;
      }

      const upsertPayload = {
        symbol,
        name: String(token.name || '').trim() || undefined,
        decimals: token.decimals,
        logoURI: String(token.logoURI || '').trim() || undefined,
        isActive: token.isActive !== false,
        raw: this.normalizeRaw(token.raw),
        syncedAt: token.syncedAt || now,
      };

      const existingToken = await this.tokenService.getTokenDetail(
        OPENOCEAN_PROVIDER,
        chainCode,
        address
      );

      // 已存在记录：直接更新
      if (existingToken) {
        await this.tokenService.updateToken(
          OPENOCEAN_PROVIDER,
          chainCode,
          address,
          upsertPayload
        );
        upserted += 1;
        continue;
      }

      try {
        // 不存在记录：先尝试创建
        await this.tokenService.createToken({
          provider: OPENOCEAN_PROVIDER,
          chainCode,
          address,
          ...upsertPayload,
        });
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }

        // 并发场景下可能命中唯一键冲突，回退为更新
        await this.tokenService.updateToken(
          OPENOCEAN_PROVIDER,
          chainCode,
          address,
          upsertPayload
        );
      }

      upserted += 1;
    }

    return upserted;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    const code = Number((error as { code?: unknown } | undefined)?.code);
    return code === 11000;
  }

  // 统一处理 raw 字段，避免写入非对象值
  private normalizeRaw(raw?: Record<string, unknown>) {
    if (!raw || typeof raw !== 'object') {
      return undefined;
    }
    return raw;
  }
}
