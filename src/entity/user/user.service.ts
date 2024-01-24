import { Inject, Provide } from '@midwayjs/core';
import { pick } from 'lodash';
import { SoftDeleteModel } from 'mongoose-delete';

import { UserMOdelProjection } from '../../constant';
import { PaginationDTO } from '../common/common.dto';

import { UserDTO, UserQueryDTO } from './user.dto';
import { User, UserSchemaName } from './user.entity';

@Provide()
export class UserService {
  @Inject(UserSchemaName)
  userModel: SoftDeleteModel<User>;

  async createUser(user: UserDTO) {
    const userRecord = await this.userModel.create(user);
    return pick(userRecord, UserMOdelProjection);
  }

  async deleteUser(userId: UserDTO['userId']) {
    await this.userModel.delete({
      userId,
    });
    return true;
  }

  async findUsers(queryInfo: UserQueryDTO, pagination: PaginationDTO) {
    const limitNum = Number(pagination.limit);
    const limit = Number.isNaN(limitNum) ? 10 : limitNum;

    const result = await this.userModel.find(
      pagination.cursor
        ? {
            _id: { $lt: pagination.cursor },
          }
        : {},
      UserMOdelProjection,
      {
        limit,
        sort: { createdAt: -1 },
      }
    );

    const latestItem =
      result.length && result.length === limit
        ? result[result.length - 1]
        : null;
    const next = latestItem?.id ?? null;

    return {
      result,
      next,
    };
  }

  async getUserDetail(userId: UserDTO['userId']) {
    const userRecord = await this.userModel.findOne(
      {
        userId,
      },
      UserMOdelProjection
    );

    return userRecord;
  }

  async updateUser(userId: UserDTO['userId'], user: Partial<UserDTO>) {
    await this.userModel.updateOne(
      {
        userId,
      },
      user,
      {
        runValidators: true,
      }
    );
    return true;
  }
}
