import { SoftDeleteModel } from 'mongoose-delete';

import { User, UserSchemaName } from './user.entity';
import { Inject, Provide } from 'service-base/dist/midway/core';

@Provide()
export class UserService {
  @Inject(UserSchemaName)
  userModel: SoftDeleteModel<User>;

  async createUser(user) {
    return this.userModel.create(user);
  }

  getUserByEmail(email: string) {
    return this.userModel.find({ email }).lean();
  }
}
