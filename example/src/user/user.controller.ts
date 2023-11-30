import { ApiResponse } from 'service-base/dist/midway/swagger';
import { SuccessWrapper } from 'service-base';
import {
  Body,
  Controller,
  Inject,
  Post,
} from 'service-base/dist/midway/core';

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
    type: SuccessWrapper(UserDTO),
  })
  async createUser(@Body() user: UserDTO) {
    return this.service.createUser(user);
  }
}
