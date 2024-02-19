import { Controller, Get } from '@midwayjs/core';

@Controller('/')
export class AppController {
  @Get('/')
  @Get('/health')
  async check() {
    return 'ok';
  }
}
