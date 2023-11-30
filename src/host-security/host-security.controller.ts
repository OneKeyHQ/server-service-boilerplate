import { Controller, Get, Inject, Query } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';

import { CheckHostDTO } from './host-security.dto';
import { HostSecurityService } from './host-security.service';

@Controller('/')
@ApiTags(['/'])
export class AppController {
  @Inject()
  service: HostSecurityService;

  @Get('/check-host')
  async getIcon(@Query() data: CheckHostDTO) {
    return this.service.checkHost(data.url);
  }
}
