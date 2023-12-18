import { ApiProperty } from '@midwayjs/swagger';

export function PayloadWrapper<T>(ResourceCls: T) {
  class Payload {
    @ApiProperty({ description: '业务状态码' })
    code: number;

    @ApiProperty({ description: '错误信息详情' })
    message: string;

    @ApiProperty({
      type: ResourceCls,
    })
    data: T;
  }

  return Payload;
}
