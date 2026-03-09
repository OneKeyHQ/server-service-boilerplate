import { randomUUID } from 'crypto';

import { Schema } from 'mongoose';

interface Network {
  id: string;
  provider: string;
  chainName: string;
  chainCode: string;
  chainId: string;
  nativeTokenAddress: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NetworkSchema = new Schema<Network>(
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
      trim: true,
      lowercase: true,
    },
    chainName: {
      type: String,
      required: true,
      trim: true,
    },
    chainCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    chainId: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    nativeTokenAddress: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
      default: undefined,
    },
    syncedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    collection: 'Network',
    timestamps: true,
  }
);

NetworkSchema.index(
  { provider: 1, chainCode: 1 },
  {
    unique: true,
    name: 'network_provider_chain_code_unique',
  }
);
NetworkSchema.index(
  { provider: 1, chainId: 1 },
  { name: 'network_provider_chain_id_index' }
);
NetworkSchema.index(
  { provider: 1, syncedAt: -1 },
  { name: 'network_provider_synced_at_index' }
);
NetworkSchema.index({ isActive: 1 }, { name: 'network_is_active_index' });
NetworkSchema.index(
  { id: 1 },
  { unique: true, sparse: true, name: 'network_id_unique' }
);

export const NetworkSchemaName = 'NetworkSchema';

export { Network, NetworkSchema };
