export function PayloadWrapper<T>(ResourceCls: T) {
  class Payload {
    code: number;

    message: string;

    data: T;
  }

  return Payload;
}
