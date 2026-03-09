import { randomUUID } from 'crypto';

import { Schema } from 'mongoose';

type SwapProviderStatus = 'active' | 'degraded' | 'disabled';

interface SwapProvider {
  id: string;
  provider: string;
  status: SwapProviderStatus;
  priority: number;
  timeoutMs: number;
  rateLimitQps: number;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SwapProviderSchema = new Schema<SwapProvider>(
  {
    id: {
      type: String,
      required: true,
      default: () => randomUUID(),
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'degraded', 'disabled'],
      default: 'active',
    },
    priority: {
      type: Number,
      required: true,
      default: 100,
    },
    timeoutMs: {
      type: Number,
      required: true,
      default: 1200,
      min: 1,
    },
    rateLimitQps: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    meta: {
      type: Schema.Types.Mixed,
      required: false,
      default: undefined,
    },
  },
  {
    collection: 'SwapProvider',
    timestamps: true,
  }
);

SwapProviderSchema.index(
  { provider: 1 },
  { unique: true, name: 'swap_provider_provider_unique' }
);
SwapProviderSchema.index(
  { status: 1, priority: 1 },
  { name: 'swap_provider_status_priority_index' }
);
SwapProviderSchema.index({ id: 1 }, { unique: true, sparse: true, name: 'swap_provider_id_unique' });

export const SwapProviderSchemaName = 'SwapProviderSchema';

export { SwapProvider, SwapProviderSchema, SwapProviderStatus };
