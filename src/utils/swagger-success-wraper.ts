import { ApiProperty } from '@midwayjs/swagger';

export function SuccessWrapper<T>(ResourceCls: T) {
  class Successed {
    @ApiProperty({ description: '状态码' })
    code: number;

    @ApiProperty({ description: '消息' })
    message: string;

    @ApiProperty({
      type: ResourceCls,
    })
    data: T;
  }

  return Successed;
}
