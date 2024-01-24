import { randomUUID } from 'crypto';

import { Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';

import normalize from '../../utils/mongoose-plugins/normalize';

/**
 * @name string
 * @email string
 * @userId string
 */
interface User extends SoftDeleteDocument {
  name?: string;
  email: string;
  userId: typeof Schema.Types.UUID;
}

const UserSchema = new Schema<User>(
  {
    name: { type: String, required: false },
    email: { type: String, required: true },
    userId: {
      type: Schema.Types.UUID,
      required: true,
      unique: true,
      default: () => randomUUID() as unknown as typeof Schema.Types.UUID,
    },
  },
  { timestamps: true }
);

UserSchema.plugin(MongooseDelete, { overrideMethods: true, deletedAt: true });
UserSchema.plugin(normalize, { uuidField: 'userId' });

export const UserSchemaName = 'UserSchema';

export { User, UserSchema };
