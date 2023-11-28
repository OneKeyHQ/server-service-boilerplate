import { ApiResponse } from '@midwayjs/swagger';

import { UserDTO } from './user.dto';
import { UserService } from './user.service';
import { SuccessWrapper } from 'service-base';
import { Body, Controller, Inject, Post } from '@midwayjs/core/dist/decorator';

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
