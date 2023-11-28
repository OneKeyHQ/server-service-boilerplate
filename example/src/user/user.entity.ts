import { Schema } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';

interface User extends SoftDeleteDocument {
  name?: string;
  email: string;
}

const UserSchema = new Schema<User>(
  {
    name: { type: String, required: false },
    email: { type: String, required: true },
  },
  { timestamps: true }
);

UserSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedAt: true });

export const UserSchemaName = 'UserSchema';

export { User, UserSchema };
