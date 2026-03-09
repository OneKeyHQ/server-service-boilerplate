import { Inject, Provide } from '@midwayjs/core';
import { FilterQuery, Model } from 'mongoose';

import { SwapProviderModelProjection } from '../../constant';
import { PaginationDTO } from '../common/common.dto';
import {
  SwapProviderCreateDTO,
  SwapProviderQueryDTO,
  SwapProviderUpdateDTO,
} from './swap-provider.dto';

import {
  SwapProvider,
  SwapProviderSchemaName,
} from './swap-provider.entity';

@Provide()
export class SwapProviderService {
  @Inject(SwapProviderSchemaName)
  swapProviderModel: Model<SwapProvider>;

  async createProvider(provider: SwapProviderCreateDTO) {
    const record = await this.swapProviderModel.create({
      ...provider,
      provider: this.normalizeLowercase(provider.provider),
    });
    return this.findProviderById(record.id);
  }

  async findProviders(query: SwapProviderQueryDTO, pagination: PaginationDTO) {
    const limitNum = Number(pagination.limit);
    const limit = Number.isNaN(limitNum) ? 10 : limitNum;
    const filters = this.buildListFilter(query, pagination);

    const result = await this.swapProviderModel.find(
      filters,
      SwapProviderModelProjection,
      {
        limit,
        sort: { createdAt: -1 },
      }
    );

    const latestItem =
      result.length && result.length === limit
        ? result[result.length - 1]
        : null;

    return {
      result,
      next: latestItem?.id ?? null,
    };
  }

  async getProviderDetail(provider: string) {
    return this.swapProviderModel.findOne(
      {
        provider: this.normalizeLowercase(provider),
      },
      SwapProviderModelProjection
    );
  }

  async updateProvider(provider: string, patch: SwapProviderUpdateDTO) {
    const payload = { ...patch } as Partial<SwapProvider>;
    delete payload.provider;
    delete payload.createdAt;
    delete payload.updatedAt;

    await this.swapProviderModel.updateOne(
      {
        provider: this.normalizeLowercase(provider),
      },
      payload,
      {
        runValidators: true,
      }
    );

    return true;
  }

  async deleteProvider(provider: string) {
    await this.swapProviderModel.deleteOne({
      provider: this.normalizeLowercase(provider),
    });
    return true;
  }

  private async findProviderById(id: string) {
    return this.swapProviderModel.findOne(
      { _id: id },
      SwapProviderModelProjection
    );
  }

  private buildListFilter(
    query: SwapProviderQueryDTO,
    pagination: PaginationDTO
  ): FilterQuery<SwapProvider> {
    const filter: FilterQuery<SwapProvider> = {};

    if (pagination.cursor) {
      filter._id = { $lt: pagination.cursor };
    }
    if (query.provider) {
      filter.provider = this.normalizeLowercase(query.provider);
    }
    if (query.status) {
      filter.status = query.status;
    }

    return filter;
  }

  private normalizeLowercase(input?: string): string {
    return String(input || '').trim().toLowerCase();
  }
}
