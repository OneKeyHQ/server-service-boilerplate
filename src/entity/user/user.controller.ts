import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@midwayjs/core';
import { pick } from 'lodash';

import { UserDTO, UserQueryDTO } from './user.dto';
import { UserService } from './user.service';

@Controller('/user')
export class UserController {
  @Inject()
  service: UserService;

  @Get('/')
  async findUsers(@Query() query: UserQueryDTO) {
    const pagination = pick(query, ['cursor', 'limit']);
    const queryInfo = pick(query, ['email']);
    return this.service.findUsers(queryInfo, pagination);
  }

  @Get('/:userId')
  async getUserDetail(@Param('userId') userId: UserDTO['userId']) {
    return this.service.getUserDetail(userId);
  }

  @Post('/')
  async createUser(@Body() user: UserDTO) {
    return this.service.createUser(user);
  }

  @Post('/:userId')
  async updateUser(
    @Body() user: UserDTO,
    @Param('userId') userId: UserDTO['userId']
  ) {
    return this.service.updateUser(userId, user);
  }

  @Post('/delete')
  async deleteUser(@Body() userId: UserDTO['userId']) {
    return this.service.deleteUser(userId);
  }
}
