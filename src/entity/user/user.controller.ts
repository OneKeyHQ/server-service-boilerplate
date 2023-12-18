import { Body, Controller, Inject, Post } from '@midwayjs/core';
import { ApiResponse } from '@midwayjs/swagger';

import { PayloadWrapper } from '../../utils/success-wrapper';

import { UserDTO } from './user.dto';
import { UserService } from './user.service';

@Controller('/user')
export class UserController {
  @Inject()
  service: UserService;

  @Post('/')
  @ApiResponse({
    status: 200,
    description: 'users module',
    type: PayloadWrapper(UserDTO),
  })
  async createUser(@Body() user: UserDTO) {
    return this.service.createUser(user);
  }
}
