import { Controller, Get, Inject, Query } from '@midwayjs/core';
import { ApiTags } from '@midwayjs/swagger';

import { GetIconDTO } from './app.dto';
import { AppService } from './app.service';

@Controller('/')
@ApiTags(['/'])
export class AppController {
  @Inject()
  service: AppService;

  @Get('/health')
  async check() {
    return 'ok';
  }

  @Get('/icon')
  async getIcon(@Query() data: GetIconDTO) {
    return this.service.getIconFromFaviconKit(
      data.url,
      data.size || 32,
      data.options
    );
  }
}
