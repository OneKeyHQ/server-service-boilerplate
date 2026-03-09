import { randomUUID } from 'crypto';

import { Schema } from 'mongoose';

interface Token {
  id: string;
  provider: string;
  chainCode: string;
  address: string;
  symbol: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
  isActive: boolean;
  raw?: Record<string, unknown>;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema = new Schema<Token>(
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
    chainCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    decimals: {
      type: Number,
      required: false,
      min: 0,
    },
    logoURI: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    raw: {
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
    collection: 'Token',
    timestamps: true,
  }
);

TokenSchema.index(
  { provider: 1, chainCode: 1, address: 1 },
  {
    unique: true,
    name: 'token_provider_chain_code_address_unique',
  }
);
TokenSchema.index(
  { provider: 1, chainCode: 1, symbol: 1 },
  { name: 'token_provider_chain_code_symbol_index' }
);
TokenSchema.index(
  { provider: 1, syncedAt: -1 },
  { name: 'token_provider_synced_at_index' }
);
TokenSchema.index({ updatedAt: -1 }, { name: 'swap_token_updated_at_index' });
TokenSchema.index(
  { id: 1 },
  { unique: true, sparse: true, name: 'token_id_unique' }
);

export const TokenSchemaName = 'TokenSchema';

export { Token, TokenSchema };
