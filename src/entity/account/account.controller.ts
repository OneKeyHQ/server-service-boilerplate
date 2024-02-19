import {
  Body,
  Controller,
  // Get,
  Inject,
  // Param,
  Post,
  // Query,
} from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
// import { pick } from 'lodash';

import { CreateUserDTO } from './account.dto';
import { AccountService } from './account.service';

@Controller('/account')
export class AccountController {
  @Inject()
  service: AccountService;

  @Post('/')
  @Validate()
  async createUser(@Body() user: CreateUserDTO) {
    return this.service.createUser(user);
  }
}
