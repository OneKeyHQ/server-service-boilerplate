import { Controller, Get } from '@midwayjs/core';
import { ApiResponse, ApiTags } from '@midwayjs/swagger';
import { SuccessWrapper } from '../utils/swagger-success-wrapper';
import { HealthDTO } from './health.dto';

@Controller('/')
@ApiTags(['/'])
export class AppController {
  @Get('/health')
  @ApiResponse({
    type: SuccessWrapper(HealthDTO),
  })
  async check() {
    return 'ok';
  }
}
